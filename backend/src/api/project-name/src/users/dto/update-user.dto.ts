import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, MinLength, Matches } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  name?: string;

  @IsString()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل باید با فرمت 09123456789 باشد' })
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean;

  @IsString()
  @MinLength(8, { message: 'رمز عبور باید حداقل 8 کاراکتر باشد' })
  @IsOptional()
  password?: string;
}

