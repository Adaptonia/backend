import { ApiProperty } from '@nestjs/swagger';

export class OAuthUserDto {
  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  picture?: string;

  @ApiProperty()
  provider: 'GOOGLE' | 'APPLE';
}
