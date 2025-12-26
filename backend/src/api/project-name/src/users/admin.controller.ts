import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllUsers() {
    const users = await this.usersService.findAll();
    // Remove sensitive data
    return users.map((user) => ({
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      loginCount: user.loginCount,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    // Remove sensitive data
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      lastLoginAt: user.lastLoginAt,
      lastLoginIp: user.lastLoginIp,
      loginCount: user.loginCount,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      country: user.country,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      notificationPreferences: user.notificationPreferences,
      metadata: user.metadata,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body() createUserDto: CreateUserDto) {
    // Check if phone already exists
    const existingUser = await this.usersService.findByPhone(createUserDto.phone);
    if (existingUser) {
      throw new Error('شماره موبایل قبلاً ثبت شده است');
    }

    // Check if email already exists (if provided)
    if (createUserDto.email) {
      const existingEmail = await this.usersService.findByEmail(createUserDto.email);
      if (existingEmail) {
        throw new Error('ایمیل قبلاً ثبت شده است');
      }
    }

    const user = await this.usersService.create({
      phone: createUserDto.phone,
      fullName: createUserDto.name,
      email: createUserDto.email,
      role: createUserDto.role || UserRole.CUSTOMER,
      password: createUserDto.password,
    });

    // Remove sensitive data
    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
    };
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if phone is being changed and already exists
    if (updateUserDto.phone && updateUserDto.phone !== user.phone) {
      const existingUser = await this.usersService.findByPhone(updateUserDto.phone);
      if (existingUser && existingUser.id !== id) {
        throw new Error('شماره موبایل قبلاً ثبت شده است');
      }
    }

    // Check if email is being changed and already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingEmail = await this.usersService.findByEmail(updateUserDto.email);
      if (existingEmail && existingEmail.id !== id) {
        throw new Error('ایمیل قبلاً ثبت شده است');
      }
    }

    const updateData: any = {};

    if (updateUserDto.name) updateData.fullName = updateUserDto.name;
    if (updateUserDto.phone) updateData.phone = updateUserDto.phone;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.role) updateData.role = updateUserDto.role;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
    if (updateUserDto.isBlocked !== undefined) {
      updateData.isBlocked = updateUserDto.isBlocked;
      // If unblocking, also clear lock
      if (!updateUserDto.isBlocked) {
        updateData.lockedUntil = null;
        updateData.failedLoginAttempts = 0;
      }
    }
    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.usersService.update(id, updateData);

    // Remove sensitive data
    return {
      id: updatedUser.id,
      phone: updatedUser.phone,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      isBlocked: updatedUser.isBlocked,
      updatedAt: updatedUser.updatedAt,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(id);
    return { message: 'کاربر با موفقیت حذف شد' };
  }
}

