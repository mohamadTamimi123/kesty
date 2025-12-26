import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OtpRedisService } from '../common/services/otp-redis.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { User, UserRole } from '../users/entities/user.entity';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private otpService: OtpRedisService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { phone, fullName, password } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersService.findByPhone(phone);

    // Send OTP (works for both new and existing users)
    const otpResult = await this.otpService.sendOtp(phone);

    // If user doesn't exist, we'll create them after OTP verification
    // If user exists but no password and password provided, update password
    if (existingUser && !existingUser.passwordHash && password) {
      await this.usersService.update(existingUser.id, {
        fullName: fullName || existingUser.fullName,
        passwordHash: await this.hashPassword(password),
      });
    } else if (existingUser && fullName && existingUser.fullName !== fullName) {
      // Update fullName if provided and different
      await this.usersService.update(existingUser.id, {
        fullName,
      });
    }

    return {
      message: 'کد تایید ارسال شد',
      expiresIn: otpResult.expiresIn,
      ...(otpResult.code && { code: otpResult.code }), // Only in mock mode
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto, ip?: string) {
    const { phone, otp, role } = verifyOtpDto;

    const isValid = await this.otpService.verifyOtp(phone, otp);
    if (!isValid) {
      throw new UnauthorizedException('کد تایید نامعتبر یا منقضی شده است');
    }

    // Find or create user
    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      // For new users, use fullName and role from verify-otp if provided, otherwise default
      const userRole = role || UserRole.CUSTOMER;
      user = await this.usersService.create({
        phone,
        fullName: verifyOtpDto.fullName || `User ${phone}`, // Default name, should be updated later
        role: userRole,
      });
    } else {
      // Update user if needed (only fullName, don't change role for existing users)
      if (verifyOtpDto.fullName && user.fullName !== verifyOtpDto.fullName) {
        await this.usersService.update(user.id, {
          fullName: verifyOtpDto.fullName,
        });
        user = await this.usersService.findById(user.id);
      }
    }

    if (!user) {
      throw new UnauthorizedException('کاربر یافت نشد');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id, ip);

    // Generate JWT token
    const accessToken = this.generateToken(user);

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async loginWithPassword(phone: string, password: string) {
    const user = await this.usersService.findByPhone(phone);
    if (!user) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('لطفاً ابتدا ثبت نام کنید');
    }

    const isValid = await this.usersService.validatePassword(user, password);
    if (!isValid) {
      throw new UnauthorizedException('شماره موبایل یا رمز عبور اشتباه است');
    }

    if (!user.isActive || user.isBlocked) {
      throw new UnauthorizedException('حساب کاربری شما غیرفعال است');
    }

    // Send OTP for additional verification
    const otpResult = await this.otpService.sendOtp(phone);

    return {
      message: 'کد تایید ارسال شد',
      expiresIn: otpResult.expiresIn,
      ...(otpResult.code && { code: otpResult.code }), // Only in mock mode
    };
  }

  async googleAuth(idToken: string, ip?: string) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    if (!googleClientId) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    try {
      // Verify Google ID token
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      const payload = response.data;
      if (payload.aud !== googleClientId) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, given_name, family_name, picture } = payload;

      // Find or create user
      let user = await this.usersService.findByEmail(email);
      if (!user) {
        // Create new user with Google account
        user = await this.usersService.create({
          phone: '', // Google users might not have phone
          email,
          fullName: `${given_name || ''} ${family_name || ''}`.trim() || email,
          role: UserRole.CUSTOMER,
        });
      } else {
        // Update user info if needed
        if (!user.email) {
          await this.usersService.update(user.id, { email });
        }
      }

      // Update last login
      await this.usersService.updateLastLogin(user.id, ip);

      // Generate JWT token
      const accessToken = this.generateToken(user);

      return {
        accessToken,
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  private generateToken(user: User): string {
    const payload = {
      sub: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.hash(password, 10);
  }
}

