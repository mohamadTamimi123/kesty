import { DataSource } from 'typeorm';
import { Conversation } from '../src/messaging/entities/conversation.entity';
import { Message } from '../src/messaging/entities/message.entity';
import { User } from '../src/users/entities/user.entity';

async function cleanupConversations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [Conversation, Message, User],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established.');

    const conversationRepository = dataSource.getRepository(Conversation);
    const messageRepository = dataSource.getRepository(Message);
    const userRepository = dataSource.getRepository(User);

    // Get all conversations with relations
    const allConversations = await conversationRepository.find({
      relations: ['customer', 'supplier'],
    });

    console.log(`\n📊 Total conversations in database: ${allConversations.length}`);

    // 1. Find conversations with missing customer or supplier
    const invalidRelations = allConversations.filter(
      (conv) => !conv.customer || !conv.supplier
    );

    console.log(`\n🔴 Conversations with invalid relations: ${invalidRelations.length}`);
    if (invalidRelations.length > 0) {
      invalidRelations.forEach((conv) => {
        console.log(`  - ID: ${conv.id}, customerId: ${conv.customerId}, supplierId: ${conv.supplierId}`);
        console.log(`    hasCustomer: ${!!conv.customer}, hasSupplier: ${!!conv.supplier}`);
      });
    }

    // 2. Find conversations with no messages and older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const emptyOldConversations: Conversation[] = [];
    for (const conv of allConversations) {
      const messageCount = await messageRepository.count({
        where: { conversationId: conv.id },
      });

      if (
        messageCount === 0 &&
        new Date(conv.createdAt) < thirtyDaysAgo
      ) {
        emptyOldConversations.push(conv);
      }
    }

    console.log(`\n🟡 Empty conversations older than 30 days: ${emptyOldConversations.length}`);
    if (emptyOldConversations.length > 0) {
      emptyOldConversations.forEach((conv) => {
        console.log(`  - ID: ${conv.id}, createdAt: ${conv.createdAt}`);
      });
    }

    // 3. Find duplicate conversations (same customer-supplier pair)
    const conversationMap = new Map<string, Conversation[]>();
    allConversations.forEach((conv) => {
      if (conv.customer && conv.supplier) {
        const key = [conv.customerId, conv.supplierId].sort().join('-');
        if (!conversationMap.has(key)) {
          conversationMap.set(key, []);
        }
        conversationMap.get(key)!.push(conv);
      }
    });

    const duplicates: Conversation[] = [];
    conversationMap.forEach((convs, key) => {
      if (convs.length > 1) {
        // Keep the most recent one, mark others as duplicates
        const sorted = convs.sort(
          (a, b) =>
            new Date(b.lastMessageAt || b.createdAt).getTime() -
            new Date(a.lastMessageAt || a.createdAt).getTime()
        );
        duplicates.push(...sorted.slice(1));
      }
    });

    console.log(`\n🟠 Duplicate conversations: ${duplicates.length}`);
    if (duplicates.length > 0) {
      duplicates.forEach((conv) => {
        console.log(`  - ID: ${conv.id}, customerId: ${conv.customerId}, supplierId: ${conv.supplierId}`);
      });
    }

    // Summary
    const toDelete = new Set([
      ...invalidRelations.map((c) => c.id),
      ...emptyOldConversations.map((c) => c.id),
      ...duplicates.map((c) => c.id),
    ]);

    console.log(`\n📋 Summary:`);
    console.log(`  - Invalid relations: ${invalidRelations.length}`);
    console.log(`  - Empty & old: ${emptyOldConversations.length}`);
    console.log(`  - Duplicates: ${duplicates.length}`);
    console.log(`  - Total unique to delete: ${toDelete.size}`);

    // Ask for confirmation (in production, you might want to add a flag)
    if (process.argv.includes('--dry-run')) {
      console.log('\n🔍 DRY RUN MODE - No deletions performed');
      console.log('Conversations that would be deleted:');
      Array.from(toDelete).forEach((id) => {
        const conv = allConversations.find((c) => c.id === id);
        if (conv) {
          console.log(`  - ${id} (customer: ${conv.customerId}, supplier: ${conv.supplierId})`);
        }
      });
    } else if (process.argv.includes('--confirm')) {
      console.log('\n🗑️  Deleting conversations...');
      let deletedCount = 0;
      for (const id of toDelete) {
        try {
          await conversationRepository.delete(id);
          deletedCount++;
          console.log(`  ✅ Deleted conversation ${id}`);
        } catch (error) {
          console.error(`  ❌ Error deleting conversation ${id}:`, error);
        }
      }
      console.log(`\n✅ Successfully deleted ${deletedCount} conversations`);
    } else {
      console.log('\n⚠️  No action taken. Use --dry-run to see what would be deleted.');
      console.log('   Use --confirm to actually delete the conversations.');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
    console.log('\n✅ Database connection closed.');
  }
}

// Run the cleanup
cleanupConversations().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

