import { IsString, IsNotEmpty, Matches, Length, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../../users/entities/user.entity';

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'کد تایید الزامی است' })
  @Length(6, 6, { message: 'کد تایید باید 6 رقم باشد' })
  otp: string;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === null || value === undefined || value === '') {
      return undefined;
    }
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      // Only return if it's a valid enum value
      if (Object.values(UserRole).includes(upperValue as UserRole)) {
        return upperValue as UserRole;
      }
    }
    // Return undefined for invalid values - this will be handled by @IsOptional
    return undefined;
  })
  @IsIn(Object.values(UserRole), { message: 'نقش کاربر معتبر نیست' })
  role?: UserRole;
}

