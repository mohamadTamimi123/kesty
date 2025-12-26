import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID('4', { message: 'شناسه مکالمه معتبر نیست' })
  conversationId: string;

  @IsString()
  @MinLength(1, { message: 'متن پیام نمی‌تواند خالی باشد' })
  content: string;
}

