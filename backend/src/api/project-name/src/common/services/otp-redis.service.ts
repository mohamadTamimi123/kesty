import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class OtpRedisService {
  private readonly mockMode: boolean;
  private readonly otpServiceUrl: string;
  private readonly otpServiceApiKey: string;
  private readonly otpExpirationTime = 2 * 60; // 2 minutes in seconds
  private readonly rateLimitTime = 60; // 1 minute in seconds

  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
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

  /**
   * Generate a 6-digit OTP code
   */
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Get Redis key for OTP
   */
  private getOtpKey(phone: string): string {
    return `otp:${phone}`;
  }

  /**
   * Get Redis key for rate limiting
   */
  private getRateLimitKey(phone: string): string {
    return `otp:rate_limit:${phone}`;
  }

  /**
   * Send OTP to phone number
   * @param phone Phone number
   * @returns OTP code (only in mock mode) and expiration time
   */
  async sendOtp(phone: string): Promise<{ code?: string; expiresIn: number }> {
    // Rate limiting: Check for recent OTP requests
    const rateLimitKey = this.getRateLimitKey(phone);
    const lastRequest = await this.redis.get(rateLimitKey);

    if (lastRequest) {
      const timeSinceLastRequest = Date.now() - parseInt(lastRequest, 10);
      const minInterval = this.rateLimitTime * 1000; // 1 minute

      if (timeSinceLastRequest < minInterval) {
        const remainingTime = Math.ceil(
          (minInterval - timeSinceLastRequest) / 1000,
        );
        throw new BadRequestException(
          `لطفاً ${remainingTime} ثانیه صبر کنید قبل از درخواست مجدد کد تایید`,
        );
      }
    }

    // Generate OTP
    const code = this.generateOtp();

    // Store OTP in Redis with expiration
    const otpKey = this.getOtpKey(phone);
    await this.redis.setex(otpKey, this.otpExpirationTime, code);

    // Set rate limit
    await this.redis.setex(
      rateLimitKey,
      this.rateLimitTime,
      Date.now().toString(),
    );

    // Send OTP via SMS
    if (this.mockMode) {
      console.log(`[MOCK OTP] Phone: ${phone}, Code: ${code}`);
    } else {
      await this.sendSms(phone, code);
    }

    return {
      code: this.mockMode ? code : undefined, // Only return code in mock mode
      expiresIn: this.otpExpirationTime,
    };
  }

  /**
   * Verify OTP code
   * @param phone Phone number
   * @param code OTP code to verify
   * @returns true if OTP is valid, false otherwise
   */
  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const otpKey = this.getOtpKey(phone);
    const storedCode = await this.redis.get(otpKey);

    if (!storedCode) {
      return false; // OTP not found or expired
    }

    if (storedCode !== code) {
      return false; // Invalid code
    }

    // Delete OTP after successful verification (one-time use)
    await this.redis.del(otpKey);

    return true;
  }

  /**
   * Get OTP code for a phone (only in mock mode for UI display)
   * @param phone Phone number
   * @returns OTP code if exists and not expired
   */
  async getOtp(phone: string): Promise<string | null> {
    if (!this.mockMode) {
      return null; // Don't expose OTP in production
    }

    const otpKey = this.getOtpKey(phone);
    const code = await this.redis.get(otpKey);
    return code;
  }

  /**
   * Get remaining TTL for OTP
   * @param phone Phone number
   * @returns Remaining seconds or -1 if not found
   */
  async getOtpTtl(phone: string): Promise<number> {
    const otpKey = this.getOtpKey(phone);
    return await this.redis.ttl(otpKey);
  }

  /**
   * Send SMS via external service
   */
  private async sendSms(phone: string, code: string): Promise<void> {
    if (!this.otpServiceUrl || !this.otpServiceApiKey) {
      throw new Error('OTP service configuration is missing');
    }

    try {
      const axios = await import('axios');
      await axios.default.post(
        this.otpServiceUrl,
        {
          phone,
          message: `کد تایید شما: ${code}`,
        },
        {
          headers: {
            Authorization: `Bearer ${this.otpServiceApiKey}`,
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

