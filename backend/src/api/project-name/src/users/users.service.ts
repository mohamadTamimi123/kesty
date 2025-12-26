import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async create(userData: {
    phone: string;
    fullName: string;
    password?: string;
    email?: string;
    role?: UserRole;
  }): Promise<User> {
    const passwordHash = userData.password
      ? await bcrypt.hash(userData.password, 10)
      : null;

    const user = this.usersRepository.create({
      phone: userData.phone,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role || UserRole.CUSTOMER,
      passwordHash,
    });

    return await this.usersRepository.save(user);
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    await this.usersRepository.update(id, updateData);
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return user;
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    if (!user.passwordHash) {
      return false;
    }
    return bcrypt.compare(password, user.passwordHash);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new Error(`User with id ${id} not found`);
    }
  }

  async updateLastLogin(id: string, ip?: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
        failedLoginAttempts: 0, // Reset on successful login
        loginCount: user.loginCount + 1,
      })
      .where('id = :id', { id })
      .execute();
  }

  async incrementFailedLoginAttempts(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    const newAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: newAttempts };

    // Lock account after 5 failed attempts for 30 minutes
    if (newAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 30);
      updateData.lockedUntil = lockUntil;
      updateData.isBlocked = true;
    }

    await this.usersRepository.update(id, updateData);
  }

  /**
   * Generate slug from text
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFFa-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Find supplier by slug (generated from workshopName or fullName)
   */
  async findSupplierBySlug(slug: string): Promise<User | null> {
    const suppliers = await this.usersRepository.find({
      where: { role: UserRole.SUPPLIER, isActive: true },
    });

    for (const supplier of suppliers) {
      const supplierSlug = this.generateSlug(supplier.workshopName || supplier.fullName);
      if (supplierSlug === slug) {
        return supplier;
      }
    }

    return null;
  }
}

