import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { OtpCode } from '../../users/entities/otp-code.entity';
import axios from 'axios';

@Injectable()
export class OtpService {
  private readonly mockMode: boolean;
  private readonly otpServiceUrl: string;
  private readonly otpServiceApiKey: string;

  constructor(
    @InjectRepository(OtpCode)
    private otpRepository: Repository<OtpCode>,
    private configService: ConfigService,
  ) {
    this.mockMode =
      this.configService.get<string>('OTP_MOCK_MODE', 'true') === 'true';
    this.otpServiceUrl = this.configService.get<string>(
      'OTP_SERVICE_URL',
      '',
    );
    this.otpServiceApiKey = this.configService.get<string>(
      'OTP_SERVICE_API_KEY',
      '',
    );
  }

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(phone: string): Promise<{ code?: string; expiresIn: number }> {
    // Rate limiting: Check for recent OTP requests
    const recentOtp = await this.otpRepository.findOne({
      where: { phone, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (recentOtp) {
      const timeSinceLastOtp =
        Date.now() - recentOtp.createdAt.getTime();
      const minInterval = 60 * 1000; // 1 minute

      if (timeSinceLastOtp < minInterval) {
        throw new BadRequestException(
          'لطفاً کمی صبر کنید قبل از درخواست مجدد کد تایید',
        );
      }
    }

    // Clean up expired OTPs
    await this.otpRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    const code = this.generateOtp();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Mark old OTPs as used
    await this.otpRepository.update(
      { phone, isUsed: false },
      { isUsed: true },
    );

    // Save new OTP
    const otpCode = this.otpRepository.create({
      phone,
      code,
      expiresAt,
    });
    await this.otpRepository.save(otpCode);

    // Send OTP via SMS
    if (this.mockMode) {
      console.log(`[MOCK OTP] Phone: ${phone}, Code: ${code}`);
    } else {
      await this.sendSms(phone, code);
    }

    return {
      code: this.mockMode ? code : undefined, // Only return code in mock mode
      expiresIn: 120,
    };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const otpCode = await this.otpRepository.findOne({
      where: { phone, code, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otpCode) {
      return false;
    }

    if (otpCode.expiresAt < new Date()) {
      return false;
    }

    if (otpCode.isUsed) {
      return false;
    }

    // Mark as used
    otpCode.isUsed = true;
    await this.otpRepository.save(otpCode);

    return true;
  }

  private async sendSms(phone: string, code: string): Promise<void> {
    if (!this.otpServiceUrl || !this.otpServiceApiKey) {
      throw new Error('OTP service configuration is missing');
    }

    try {
      await axios.post(
        this.otpServiceUrl,
        {
          phone,
          message: `کد تایید شما: ${code}`,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.otpServiceApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw new Error('Failed to send OTP. Please try again later.');
    }
  }
}

