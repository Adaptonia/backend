import { IsNotEmpty, IsUUID, IsOptional, IsEnum } from 'class-validator';

// Define the enum locally instead of importing from @prisma/client
export enum ChannelRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER'
}

export class AddChannelMemberDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsUUID()
  channelId: string;

  @IsOptional()
  @IsEnum(ChannelRole)
  role?: ChannelRole;
} 