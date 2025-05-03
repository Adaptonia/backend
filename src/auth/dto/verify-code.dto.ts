import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyCodeDto {
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
  @Length(4, 4, { message: 'Verification code must be exactly 4 characters' })
  code: string;
} 