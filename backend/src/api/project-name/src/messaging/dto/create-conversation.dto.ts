import { IsUUID, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsUUID('4', { message: 'شناسه تولیدکننده معتبر نیست' })
  supplierId: string;

  @IsOptional()
  @IsUUID('4', { message: 'شناسه پروژه معتبر نیست' })
  projectId?: string;
}

