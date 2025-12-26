import { DataSource } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

export async function seedAdmin(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Admin credentials
  const adminPhone = '09123456789';
  const adminPassword = 'admin123';
  const adminFullName = 'Super Admin';
  const adminEmail = 'admin@keesti.com';

  // Check if admin already exists
  const existingAdmin = await userRepository.findOne({
    where: { phone: adminPhone },
  });

  if (existingAdmin) {
    console.log('Admin user already exists. Updating...');
    
    // Update existing admin
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    existingAdmin.fullName = adminFullName;
    existingAdmin.email = adminEmail;
    existingAdmin.role = UserRole.ADMIN;
    existingAdmin.passwordHash = passwordHash;
    existingAdmin.isActive = true;
    existingAdmin.isBlocked = false;
    
    await userRepository.save(existingAdmin);
    console.log('Admin user updated successfully!');
    console.log(`Phone: ${adminPhone}`);
    console.log(`Password: ${adminPassword}`);
  } else {
    console.log('Creating admin user...');
    
    // Create new admin
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = userRepository.create({
      phone: adminPhone,
      fullName: adminFullName,
      email: adminEmail,
      role: UserRole.ADMIN,
      passwordHash,
      isActive: true,
      isBlocked: false,
    });

    await userRepository.save(admin);
    console.log('Admin user created successfully!');
    console.log(`Phone: ${adminPhone}`);
    console.log(`Password: ${adminPassword}`);
  }
}

