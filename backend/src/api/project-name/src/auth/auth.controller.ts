import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpRedisService } from '../common/services/otp-redis.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpRedisService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.OK)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    return this.authService.verifyOtp(verifyOtpDto, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: { phone: string; password: string }) {
    return this.authService.loginWithPassword(loginDto.phone, loginDto.password);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleAuth(@Body() googleAuthDto: GoogleAuthDto, @Req() req: any) {
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
    return this.authService.googleAuth(googleAuthDto.idToken, ip);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    // In a stateless JWT system, logout is handled client-side
    // But we can add token blacklisting here if needed
    return { message: 'خروج موفقیت‌آمیز بود' };
  }

  @Get('otp')
  @HttpCode(HttpStatus.OK)
  async getOtp(@Query('phone') phone: string) {
    // Get OTP code for display in UI (only in mock mode)
    const code = await this.otpService.getOtp(phone);
    const ttl = await this.otpService.getOtpTtl(phone);
    
    return {
      code: code || null,
      expiresIn: ttl > 0 ? ttl : 0,
      exists: !!code,
    };
  }
}

