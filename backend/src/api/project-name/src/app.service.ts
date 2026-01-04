import { Injectable } from '@nestjs/common';

export interface ContactData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async handleContact(contactData: ContactData): Promise<{ success: boolean; message: string }> {
    // TODO: Implement email sending and/or database storage
    // In production, you would:
    // 1. Save to database (tickets table)
    // 2. Send email notification to admin
    // 3. Send confirmation email to user
    
    // For now, just return success
    // Contact data should be logged/stored by the calling service
    
    return {
      success: true,
      message: 'پیام شما با موفقیت دریافت شد. به زودی با شما تماس خواهیم گرفت.',
    };
  }
}
