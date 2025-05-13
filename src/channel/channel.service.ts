import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChannelDto, ChannelType } from './dto/create-channel.dto';
import { AddChannelMemberDto, ChannelRole } from './dto/add-channel-member.dto';
import { CreateMessageDto } from '../chat/dto/create-message.dto';
import * as crypto from 'crypto';

@Injectable()
export class ChannelService {
  constructor(private prisma: PrismaService) {}

  async createChannel(createChannelDto: CreateChannelDto, creatorId: string) {
    const { name, description, icon, type, isPublic } = createChannelDto;

    // Create channel transaction with first member (creator)
    const channel = await this.prisma.$transaction(async (prisma) => {
      // Create the channel
      const newChannel = await prisma.channel.create({
        data: {
          name,
          description,
          icon,
          type: type || ChannelType.GROUP,
          isPublic: isPublic ?? true,
        },
      });

      // Add creator as member with OWNER role
      await prisma.channelMember.create({
        data: {
          channelId: newChannel.id,
          userId: creatorId,
          role: ChannelRole.OWNER,
        },
      });

      return newChannel;
    });

    return channel;
  }

  async getChannelById(channelId: string, userId: string) {
    // Check if channel exists and user is a member
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is a member of this channel
    const userMembership = channel.members.find(member => member.userId === userId);
    if (!userMembership && !channel.isPublic) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    return channel;
  }

  async getUserChannels(userId: string) {
    // Get all channels where user is a member
    const memberships = await this.prisma.channelMember.findMany({
      where: { userId },
      include: {
        channel: true,
      },
    });

    return memberships.map(membership => ({
      ...membership.channel,
      role: membership.role,
    }));
  }

  async addChannelMember(addMemberDto: AddChannelMemberDto, adminId: string) {
    const { userId, channelId, role } = addMemberDto;

    // Check if channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if admin is authorized (owner or admin)
    const adminMember = channel.members.find(member => member.userId === adminId);
    if (!adminMember || 
        (adminMember.role !== ChannelRole.OWNER && adminMember.role !== ChannelRole.ADMIN)) {
      throw new ForbiddenException('You are not authorized to add members to this channel');
    }

    // Check if user is already a member
    const existingMember = channel.members.find(member => member.userId === userId);
    if (existingMember) {
      return existingMember; // User is already a member
    }

    // Add the new member
    const newMember = await this.prisma.channelMember.create({
      data: {
        userId,
        channelId,
        role: role || ChannelRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        channel: true,
      },
    });

    return newMember;
  }

  async removeChannelMember(channelId: string, memberId: string, adminId: string) {
    // Check if channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if admin is authorized (owner or admin)
    const adminMember = channel.members.find(member => member.userId === adminId);
    if (!adminMember || 
        (adminMember.role !== ChannelRole.OWNER && adminMember.role !== ChannelRole.ADMIN)) {
      throw new ForbiddenException('You are not authorized to remove members from this channel');
    }

    // Check if target is a member
    const targetMember = channel.members.find(member => member.userId === memberId);
    if (!targetMember) {
      throw new NotFoundException('Member not found in this channel');
    }

    // Cannot remove the owner
    if (targetMember.role === ChannelRole.OWNER) {
      throw new ForbiddenException('Cannot remove the channel owner');
    }

    // Admin can't remove another admin
    if (adminMember.role !== ChannelRole.OWNER && targetMember.role === ChannelRole.ADMIN) {
      throw new ForbiddenException('Admins cannot remove other admins');
    }

    // Remove the member
    await this.prisma.channelMember.delete({
      where: {
        id: targetMember.id,
      },
    });

    return { success: true };
  }

  async getChannelMessages(channelId: string, userId: string) {
    // Check if channel exists and user is a member
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is a member of this channel
    const userMembership = channel.members.find(member => member.userId === userId);
    if (!userMembership && !channel.isPublic) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    // Get messages for this channel
    const messages = await this.prisma.message.findMany({
      where: {
        channelId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return messages;
  }

  async sendChannelMessage(createMessageDto: CreateMessageDto) {
    const { senderId, channelId, content } = createMessageDto;

    if (!channelId) {
      throw new NotFoundException('Channel ID is required');
    }

    // Check if channel exists and user is a member
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if user is a member of this channel
    const userMembership = channel.members.find(member => member.userId === senderId);
    if (!userMembership && !channel.isPublic) {
      throw new ForbiddenException('You do not have access to this channel');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        channel: { connect: { id: channelId } },
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return message;
  }

  async updateChannelInfo(
    channelId: string, 
    updateData: Partial<CreateChannelDto>, 
    adminId: string
  ) {
    // Check if channel exists
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: true,
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Check if admin is authorized (owner or admin)
    const adminMember = channel.members.find(member => member.userId === adminId);
    if (!adminMember || 
        (adminMember.role !== ChannelRole.OWNER && adminMember.role !== ChannelRole.ADMIN)) {
      throw new ForbiddenException('You are not authorized to update this channel');
    }

    // Update channel
    const updatedChannel = await this.prisma.channel.update({
      where: { id: channelId },
      data: updateData,
    });

    return updatedChannel;
  }

  async getPublicChannels() {
    // Get all public channels
    const channels = await this.prisma.channel.findMany({
      where: {
        isPublic: true,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return channels.map(channel => ({
      ...channel,
      memberCount: channel._count.members,
      _count: undefined,
    }));
  }

  async joinPublicChannel(channelId: string, userId: string) {
    console.log(`Service: User ${userId} joining channel ${channelId}`);
    
    try {
      // Check if channel exists
      const channel = await this.prisma.channel.findUnique({
        where: { id: channelId },
      });

      if (!channel) {
        console.error(`Channel ${channelId} not found`);
        throw new NotFoundException('Channel not found');
      }

      // Check if the channel is public
      if (!channel.isPublic) {
        console.error(`Channel ${channelId} is not public`);
        throw new ForbiddenException('You cannot join a private channel directly');
      }

      // Check if user is already a member (using a separate query to avoid race conditions)
      const existingMembership = await this.prisma.channelMember.findFirst({
        where: {
          userId,
          channelId,
        },
      });

      if (existingMembership) {
        console.log(`User ${userId} is already a member of channel ${channelId}`);
        return {
          ...existingMembership,
          message: 'You are already a member of this channel',
        };
      }

      // Add the user as a member with MEMBER role
      console.log(`Adding user ${userId} as a member to channel ${channelId}`);
      const membership = await this.prisma.channelMember.create({
        data: {
          userId,
          channelId,
          role: ChannelRole.MEMBER,
        },
      });

      // Get additional user info for the response
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      return {
        ...membership,
        user,
        message: 'Successfully joined channel',
      };
    } catch (error) {
      console.error(`Error joining channel: ${error.message}`);
      throw error;
    }
  }

  async generateChannelInviteCode(channelId: string, userId: string) {
   // check if channel exists with a raw query
   const channels = await this.prisma.$queryRawUnsafe(
     'SELECT * FROM `Channel` WHERE `id` = ?',
     channelId
   ) as any[];
   
   const channel = channels[0];

   if (!channel) {
    throw new NotFoundException('Channel not found');
   }
   
   // Get channel members
   const members = await this.prisma.channelMember.findMany({
     where: { channelId }
   });

   // check if user is authorized (owner or admin)
   const userMember = members.find(member => member.userId === userId);
   if (!userMember || (userMember.role !== ChannelRole.OWNER && userMember.role !== ChannelRole.ADMIN)) {
    throw new ForbiddenException('You are not authorized to generate invite codes for this channel');
   }

   // generate invite code
   const inviteCode = `${channelId}-${crypto.randomUUID().slice(0, 8)}`;

   // save invite code to channel using a prepared statement instead of raw SQL
   await this.prisma.$executeRawUnsafe(
     'UPDATE `Channel` SET `inviteCode` = ? WHERE `id` = ?',
     inviteCode,
     channelId
   );

   return inviteCode;
  }

  async joinChannelByInviteCode(inviteCode: string, userId: string) {
    // find the channel with this invite code using raw query
    const channels = await this.prisma.$queryRaw`
      SELECT * FROM Channel WHERE inviteCode = ${inviteCode}
    ` as any[];
    
    const channel = channels[0];
    
    if (!channel) {
      throw new NotFoundException('Invalid invite code');
    }
    
    // Get channel members to check if user is already a member
    const members = await this.prisma.channelMember.findMany({
      where: { channelId: channel.id }
    });
    
    // check if user is already a member
    const existingMember = members.find(member => member.userId === userId);
    if (existingMember) {
      throw new ForbiddenException('You are already a member of this channel');
    }

    // add user as a member with MEMBER role
    const membership = await this.prisma.channelMember.create({
      data: {
        userId,
        channelId: channel.id,
        role: ChannelRole.MEMBER,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    
    return {
      ...membership,
      message: 'Successfully joined channel',
    };
  }
} 