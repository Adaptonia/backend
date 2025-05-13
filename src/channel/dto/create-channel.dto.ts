import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';

// Define the enum locally instead of importing from @prisma/client
export enum ChannelType {
  GROUP = 'GROUP',
  DISCUSSION = 'DISCUSSION',
  SUPPORT = 'SUPPORT',
  ANNOUNCEMENTS = 'ANNOUNCEMENTS'
}

export class CreateChannelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(ChannelType)
  type?: ChannelType;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
} 