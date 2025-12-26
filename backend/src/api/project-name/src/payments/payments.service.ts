import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { ZarinpalService } from './services/zarinpal.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(PaymentTransaction)
    private transactionRepository: Repository<PaymentTransaction>,
    private zarinpalService: ZarinpalService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async createPayment(
    userId: string,
    amount: number,
    subscriptionPlanId: string,
    description?: string,
  ) {
    const payment = this.paymentRepository.create({
      userId,
      amount,
      subscriptionPlanId,
      description,
      status: PaymentStatus.PENDING,
    });
    const savedPayment = await this.paymentRepository.save(payment);

    const { authority, paymentUrl } = await this.zarinpalService.createPaymentRequest(
      amount,
      description || 'پرداخت اشتراک',
      userId,
    );

    await this.transactionRepository.save({
      paymentId: savedPayment.id,
      authority,
    });

    return { paymentId: savedPayment.id, paymentUrl, authority };
  }

  async verifyPayment(paymentId: string, authority: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    const { refId, success } = await this.zarinpalService.verifyPayment(
      authority,
      payment.amount,
    );

    if (success) {
      payment.status = PaymentStatus.COMPLETED;
      await this.paymentRepository.save(payment);

      await this.transactionRepository.save({
        paymentId,
        authority,
        refId,
        response: JSON.stringify({ success: true }),
      });

      // Activate subscription
      if (payment.subscriptionPlanId) {
        const plan = await this.subscriptionsService.findPlanById(
          payment.subscriptionPlanId,
        );
        const endDate = new Date();
        endDate.setMonth(
          endDate.getMonth() + (plan.billingPeriod === 'MONTHLY' ? 1 : 12),
        );
        await this.subscriptionsService.createSubscription(
          payment.userId,
          payment.subscriptionPlanId,
          new Date(),
          endDate,
        );
      }
    } else {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepository.save(payment);
    }

    return { success, refId };
  }
}

