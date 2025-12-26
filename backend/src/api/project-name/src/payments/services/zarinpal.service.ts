import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ZarinpalService {
  private readonly merchantId: string;
  private readonly baseUrl: string;
  private readonly callbackUrl: string;

  constructor() {
    this.merchantId = process.env.ZARINPAL_MERCHANT_ID || '';
    this.baseUrl =
      process.env.ZARINPAL_SANDBOX === 'true'
        ? 'https://sandbox.zarinpal.com/pg/v4/payment'
        : 'https://api.zarinpal.com/pg/v4/payment';
    this.callbackUrl = process.env.ZARINPAL_CALLBACK_URL || '';
  }

  async createPaymentRequest(amount: number, description: string, userId: string) {
    const response = await axios.post(`${this.baseUrl}/request.json`, {
      merchant_id: this.merchantId,
      amount: amount * 10, // Convert to Toman (multiply by 10)
      description,
      callback_url: `${this.callbackUrl}?userId=${userId}`,
    });

    return {
      authority: response.data.data.authority,
      paymentUrl: `https://sandbox.zarinpal.com/pg/StartPay/${response.data.data.authority}`,
    };
  }

  async verifyPayment(authority: string, amount: number) {
    const response = await axios.post(`${this.baseUrl}/verify.json`, {
      merchant_id: this.merchantId,
      authority,
      amount: amount * 10,
    });

    return {
      refId: response.data.data.ref_id,
      success: response.data.data.code === 100,
    };
  }
}

