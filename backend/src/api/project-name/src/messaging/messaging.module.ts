import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { MessagingGateway } from './messaging.gateway';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MessagingController],
  providers: [
    MessagingService,
    MessagingGateway,
    {
      provide: 'MESSAGING_SERVICE_INIT',
      useFactory: (service: MessagingService, gateway: MessagingGateway) => {
        service.setGateway(gateway);
        return true;
      },
      inject: [MessagingService, MessagingGateway],
    },
  ],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}

