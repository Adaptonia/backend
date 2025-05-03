import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The email address associated with the account',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The verification code sent to the user email',
    example: '1234'
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'The new password',
    example: 'newSecurePassword123'
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Confirm the new password',
    example: 'newSecurePassword123'
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  confirmPassword: string;
} 