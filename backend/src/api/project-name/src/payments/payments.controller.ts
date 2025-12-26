import { Controller, Post, Get, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  async createPayment(
    @CurrentUser() user: any,
    @Body() body: { amount: number; subscriptionPlanId: string; description?: string },
  ) {
    return this.paymentsService.createPayment(
      user.id,
      body.amount,
      body.subscriptionPlanId,
      body.description,
    );
  }

  @Get('verify')
  async verifyPayment(@Query('paymentId') paymentId: string, @Query('authority') authority: string) {
    return this.paymentsService.verifyPayment(paymentId, authority);
  }
}

