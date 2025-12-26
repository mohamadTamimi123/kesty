import { IsString, IsNotEmpty, Matches, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'شماره موبایل الزامی است' })
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'نام و نام خانوادگی الزامی است' })
  fullName: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'رمز عبور باید حداقل 8 کاراکتر باشد' })
  password?: string;
}

