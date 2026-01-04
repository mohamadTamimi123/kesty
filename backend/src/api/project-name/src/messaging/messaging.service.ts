import { Injectable, NotFoundException, ForbiddenException, Optional, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { UserRole } from '../users/entities/user.entity';
import { CacheService } from '../common/services/cache.service';

@Injectable()
export class MessagingService {
  private messagingGateway: any;
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private cacheService: CacheService,
  ) {}

  setGateway(gateway: any) {
    this.messagingGateway = gateway;
  }

  /**
   * Get or create conversation between customer and supplier
   */
  async getOrCreateConversation(
    customerId: string,
    supplierId: string,
  ): Promise<Conversation> {
    // Check if conversation already exists
    let conversation = await this.conversationRepository.findOne({
      where: [
        { customerId, supplierId },
        { customerId: supplierId, supplierId: customerId },
      ],
      relations: ['customer', 'supplier'],
    });

    if (!conversation) {
      // Create new conversation
      conversation = this.conversationRepository.create({
        customerId,
        supplierId,
      });
      conversation = await this.conversationRepository.save(conversation);
    }

    const foundConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });

    if (!foundConversation) {
      throw new NotFoundException('مکالمه یافت نشد');
    }

    return foundConversation;
  }

  /**
   * Create a new conversation
   * Uses "get or create" pattern to prevent duplicates
   * Automatically determines customer and supplier based on roles
   */
  async createConversation(
    currentUserId: string,
    createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    const projectId = createConversationDto.projectId || null;
    const otherUserId = createConversationDto.supplierId;

    // Fetch both users to check their roles
    const { User } = await import('../users/entities/user.entity');
    const userRepository = this.conversationRepository.manager.getRepository(User);
    
    const [currentUser, otherUser] = await Promise.all([
      userRepository.findOne({ where: { id: currentUserId } }),
      userRepository.findOne({ where: { id: otherUserId } }),
    ]);

    if (!currentUser || !otherUser) {
      throw new NotFoundException('کاربر یافت نشد');
    }

    // Determine customer and supplier based on roles
    let actualCustomerId: string;
    let actualSupplierId: string;

    if (currentUser.role === UserRole.CUSTOMER && otherUser.role === UserRole.SUPPLIER) {
      // Current user is customer, other is supplier
      actualCustomerId = currentUserId;
      actualSupplierId = otherUserId;
    } else if (currentUser.role === UserRole.SUPPLIER && otherUser.role === UserRole.CUSTOMER) {
      // Current user is supplier, other is customer
      actualCustomerId = otherUserId;
      actualSupplierId = currentUserId;
    } else {
      throw new ForbiddenException('مکالمه فقط بین مشتری و تولیدکننده امکان‌پذیر است');
    }

    // Check if conversation already exists
    // Handle both cases: with projectId and without projectId
    const whereConditions: any[] = [];
    
    if (projectId) {
      // Check for exact match: customerId, supplierId, projectId
      whereConditions.push({
        customerId: actualCustomerId,
        supplierId: actualSupplierId,
        projectId,
      });
      // Also check reverse order (customer-supplier swap) - shouldn't happen but just in case
      whereConditions.push({
        customerId: actualSupplierId,
        supplierId: actualCustomerId,
        projectId,
      });
    } else {
      // For conversations without projectId, check both directions
      whereConditions.push({
        customerId: actualCustomerId,
        supplierId: actualSupplierId,
        projectId: null,
      });
      whereConditions.push({
        customerId: actualSupplierId,
        supplierId: actualCustomerId,
        projectId: null,
      });
    }

    const existingConversation = await this.conversationRepository.findOne({
      where: whereConditions,
      relations: ['customer', 'supplier'],
    });

    if (existingConversation) {
      // Invalidate cache and return existing conversation
      await this.cacheService.invalidate(`conversations:user:${currentUserId}`);
      await this.cacheService.invalidate(`conversations:user:${otherUserId}`);
      return existingConversation;
    }

    // Create new conversation with correct customer/supplier assignment
    const conversation = this.conversationRepository.create({
      customerId: actualCustomerId,
      supplierId: actualSupplierId,
      projectId,
    });

    const savedConversation = await this.conversationRepository.save(conversation);

    // Invalidate cache for both users
    await this.cacheService.invalidate(`conversations:user:${currentUserId}`);
    await this.cacheService.invalidate(`conversations:user:${otherUserId}`);

    // Reload with relations
    const foundConversation = await this.conversationRepository.findOne({
      where: { id: savedConversation.id },
      relations: ['customer', 'supplier'],
    });

    if (!foundConversation) {
      throw new NotFoundException('مکالمه پس از ایجاد یافت نشد');
    }

    return foundConversation;
  }

  /**
   * Get conversations for a user
   * Only returns conversations that have at least one message (lastMessageAt IS NOT NULL)
   */
  async getConversationsForUser(userId: string): Promise<Conversation[]> {
    const cacheKey = `conversations:user:${userId}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const conversations = await this.conversationRepository
          .createQueryBuilder('conversation')
          .leftJoinAndSelect('conversation.customer', 'customer')
          .leftJoinAndSelect('conversation.supplier', 'supplier')
          .where('(conversation.customerId = :userId OR conversation.supplierId = :userId)', { userId })
          .andWhere('conversation.lastMessageAt IS NOT NULL') // Only conversations with messages
          .select([
            'conversation.id',
            'conversation.customerId',
            'conversation.supplierId',
            'conversation.projectId',
            'conversation.lastMessageAt',
            'conversation.customerUnreadCount',
            'conversation.supplierUnreadCount',
            'conversation.createdAt',
            'conversation.updatedAt',
            'customer.id',
            'customer.fullName',
            'customer.phone',
            'customer.email',
            'customer.role',
            'supplier.id',
            'supplier.fullName',
            'supplier.phone',
            'supplier.email',
            'supplier.role',
          ])
          .orderBy('conversation.lastMessageAt', 'DESC')
          .addOrderBy('conversation.createdAt', 'DESC')
          .getMany();
        
        // Fetch last message for each conversation
        const conversationsWithLastMessage = await Promise.all(
          conversations.map(async (conv) => {
            const lastMessage = await this.messageRepository.findOne({
              where: { conversationId: conv.id },
              relations: ['sender'],
              order: { createdAt: 'DESC' },
            });
            
            return {
              ...conv,
              lastMessage: lastMessage || null,
            };
          })
        );
        
        return conversationsWithLastMessage;
      },
      this.CACHE_TTL,
    );
  }

  /**
   * Get conversation by ID
   */
  async getConversationById(
    conversationId: string,
    userId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['customer', 'supplier'],
    });

    if (!conversation) {
      throw new NotFoundException('مکالمه یافت نشد');
    }

    // Check if user is part of this conversation
    if (conversation.customerId !== userId && conversation.supplierId !== userId) {
      throw new ForbiddenException('شما دسترسی به این مکالمه ندارید');
    }

    return conversation;
  }

  /**
   * Send a message
   */
  async sendMessage(
    senderId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const conversation = await this.getConversationById(
      createMessageDto.conversationId,
      senderId,
    );

    const newMessage = this.messageRepository.create({
      conversationId: createMessageDto.conversationId,
      senderId,
      content: createMessageDto.content,
      metadata: createMessageDto.metadata || null,
      deliveredAt: new Date(), // Mark as delivered when sent
    });

    const savedMessage = await this.messageRepository.save(newMessage);

    // Update conversation last message time and unread counts
    // Only increment unread count for the receiver, not the sender
    const isCustomer = conversation.customerId === senderId;
    await this.conversationRepository.update(conversation.id, {
      lastMessageAt: new Date(),
      // If sender is customer, increment supplier's unread count
      // If sender is supplier, increment customer's unread count
      customerUnreadCount: isCustomer
        ? conversation.customerUnreadCount  // Sender is customer, don't increment
        : conversation.customerUnreadCount + 1,  // Sender is supplier, increment customer's count
      supplierUnreadCount: isCustomer
        ? conversation.supplierUnreadCount + 1  // Sender is customer, increment supplier's count
        : conversation.supplierUnreadCount,  // Sender is supplier, don't increment
    });

    const retrievedMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'conversation'],
    });

    if (!retrievedMessage) {
      throw new NotFoundException('پیام پس از ذخیره یافت نشد');
    }

    // Invalidate cache for both users when message is sent
    await this.cacheService.invalidate(`conversations:user:${conversation.customerId}`);
    await this.cacheService.invalidate(`conversations:user:${conversation.supplierId}`);

    // Emit real-time update via WebSocket
    const updatedConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });
    
    if (updatedConversation && this.messagingGateway) {
      this.messagingGateway.emitNewMessage(updatedConversation, retrievedMessage);
      this.messagingGateway.emitMessageDelivered(conversation.id, retrievedMessage.id);
      this.messagingGateway.emitConversationUpdate(conversation.customerId, updatedConversation);
      this.messagingGateway.emitConversationUpdate(conversation.supplierId, updatedConversation);
    }

    return retrievedMessage;
  }

  /**
   * Mark message as delivered
   */
  async markMessageAsDelivered(messageId: string): Promise<void> {
    await this.messageRepository.update(
      { id: messageId, deliveredAt: IsNull() },
      { deliveredAt: new Date() },
    );
  }

  /**
   * Get messages for a conversation
   */
  async getMessagesForConversation(
    conversationId: string,
    userId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const conversation = await this.getConversationById(conversationId, userId);

    return this.messageRepository.find({
      where: { conversationId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    const conversation = await this.getConversationById(conversationId, userId);

    // Mark all unread messages as read
    await this.messageRepository.update(
      {
        conversationId,
        senderId: userId === conversation.customerId ? conversation.supplierId : conversation.customerId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    // Update unread counts
    const isCustomer = conversation.customerId === userId;
    await this.conversationRepository.update(conversation.id, {
      customerUnreadCount: isCustomer ? 0 : conversation.customerUnreadCount,
      supplierUnreadCount: isCustomer ? conversation.supplierUnreadCount : 0,
    });

    // Emit real-time update via WebSocket
    const updatedConversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['customer', 'supplier'],
    });
    
    if (updatedConversation && this.messagingGateway) {
      // Emit read receipts for all read messages
      const readMessages = await this.messageRepository.find({
        where: {
          conversationId,
          senderId: userId === conversation.customerId ? conversation.supplierId : conversation.customerId,
          isRead: true,
        },
      });
      
      readMessages.forEach((msg) => {
        this.messagingGateway.emitMessageRead(conversation.id, msg.id, userId);
      });
      
      this.messagingGateway.emitConversationUpdate(userId, updatedConversation);
      const otherUserId = isCustomer ? conversation.supplierId : conversation.customerId;
      this.messagingGateway.emitConversationUpdate(otherUserId, updatedConversation);
    }
  }

  /**
   * Get user online status
   */
  async getUserOnlineStatus(userId: string): Promise<{ isOnline: boolean; lastSeenAt: Date | null }> {
    // This will be enhanced with WebSocket connection tracking
    // For now, return lastSeenAt from user entity
    const { User } = await import('../users/entities/user.entity');
    const userRepository = this.messageRepository.manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    
    return {
      isOnline: false, // Will be updated by gateway
      lastSeenAt: user?.lastSeenAt || null,
    };
  }

  /**
   * Update user last seen timestamp
   */
  async updateUserLastSeen(userId: string): Promise<void> {
    const { User } = await import('../users/entities/user.entity');
    const userRepository = this.messageRepository.manager.getRepository(User);
    await userRepository.update({ id: userId }, { lastSeenAt: new Date() });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.conversationRepository.find({
      where: [{ customerId: userId }, { supplierId: userId }],
    });

    return conversations.reduce((total, conv) => {
      if (conv.customerId === userId) {
        return total + conv.customerUnreadCount;
      } else {
        return total + conv.supplierUnreadCount;
      }
    }, 0);
  }
}

