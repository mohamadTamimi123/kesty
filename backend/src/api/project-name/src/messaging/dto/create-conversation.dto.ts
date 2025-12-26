import { IsUUID } from 'class-validator';

export class CreateConversationDto {
  @IsUUID('4', { message: 'شناسه تولیدکننده معتبر نیست' })
  supplierId: string;
}

