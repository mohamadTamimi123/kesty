import { IsString, IsEmail, IsOptional, IsEnum, MinLength, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل باید با فرمت 09123456789 باشد' })
  phone: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل 8 کاراکتر باشد' })
  password: string;
}

