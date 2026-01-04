import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Category } from '../src/categories/entities/category.entity';
import { City } from '../src/cities/entities/city.entity';
import { ProjectStatus } from '../src/projects/entities/project.entity';

async function testProjectCreation() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'keesti_db',
    entities: [User, Project, Category, City],
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('✓ Database connection established');

    const userRepo = dataSource.getRepository(User);
    const projectRepo = dataSource.getRepository(Project);
    const categoryRepo = dataSource.getRepository(Category);
    const cityRepo = dataSource.getRepository(City);

    // Find a customer user (فرهاد صادقی)
    const customer = await userRepo.findOne({
      where: { fullName: 'فرهاد صادقی' },
    });

    if (!customer) {
      console.error('✗ Customer "فرهاد صادقی" not found. Please run seeders first.');
      process.exit(1);
    }

    // Find categories and cities
    const categories = await categoryRepo.find({ take: 5 });
    const cities = await cityRepo.find({ take: 5 });

    if (categories.length === 0 || cities.length === 0) {
      console.error('✗ Categories or cities not found. Please run seeders first.');
      process.exit(1);
    }

    console.log(`\n📝 Creating test projects for customer: ${customer.fullName} (${customer.id})`);

    // Create 3 test projects
    const testProjects = [
      {
        title: 'پروژه تستی 1 - فرز سی‌ان‌سی',
        description: 'این یک پروژه تستی برای بررسی سیستم چت است. نیاز به فرزکاری دقیق با دستگاه سی‌ان‌سی داریم.',
        categoryId: categories.find(c => c.title.includes('فرز'))?.id || categories[0].id,
        cityId: cities.find(c => c.title.includes('رشت'))?.id || cities[0].id,
      },
      {
        title: 'پروژه تستی 2 - تراشکاری',
        description: 'پروژه تستی برای تراشکاری قطعات فلزی با دقت بالا.',
        categoryId: categories.find(c => c.title.includes('تراش'))?.id || categories[1]?.id || categories[0].id,
        cityId: cities[1]?.id || cities[0].id,
      },
      {
        title: 'پروژه تستی 3 - ورقکاری',
        description: 'پروژه تستی برای ورقکاری و خمکاری ورق‌های فلزی.',
        categoryId: categories.find(c => c.title.includes('ورق'))?.id || categories[2]?.id || categories[0].id,
        cityId: cities[2]?.id || cities[0].id,
      },
    ];

    const createdProjects: Project[] = [];
    for (const projectData of testProjects) {
      const project = projectRepo.create({
        title: projectData.title,
        description: projectData.description,
        customerId: customer.id,
        categoryId: projectData.categoryId,
        cityId: projectData.cityId,
        status: ProjectStatus.PENDING,
        isPublic: true,
      });

      const savedProject = await projectRepo.save(project);
      createdProjects.push(savedProject);
      console.log(`✓ Created project: ${savedProject.title} (${savedProject.id})`);
    }

    console.log(`\n✅ Successfully created ${createdProjects.length} test projects`);
    console.log('\n📋 Project IDs:');
    createdProjects.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.title}: ${p.id}`);
    });

    console.log('\n💡 Projects will be automatically distributed to suppliers via the project-distribution service.');
    console.log('   Check the chat interface to see the notification messages.');

  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

testProjectCreation();
