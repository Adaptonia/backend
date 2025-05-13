import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getDirectMessages(userId: string, otherUserId: string) {
    // Verify both users exist
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const otherUser = await this.prisma.user.findUnique({ where: { id: otherUserId } });
    
    if (!user || !otherUser) {
      throw new NotFoundException('One or both users not found');
    }

    // Get messages between these two users
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        channelId: null, // Ensure these are direct messages, not channel messages
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

  async sendDirectMessage(createMessageDto: CreateMessageDto) {
    const { senderId, receiverId, content } = createMessageDto;
    
    // Verify both users exist
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });
    
    if (!sender || !receiver) {
      throw new NotFoundException('Sender or receiver not found');
    }

    // Create the message
    const message = await this.prisma.message.create({
      data: {
        content,
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
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

  async markMessagesAsRead(userId: string, otherUserId: string) {
    // Mark all unread messages from otherUser to user as read
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return { success: true };
  }

  // New method to mark a specific message as read
  async markMessageAsRead(messageId: string, userId: string) {
    // First, find the message to ensure it exists and the user is the receiver
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Ensure the user is the receiver of this message
    if (message.receiverId !== userId) {
      throw new NotFoundException('User is not the recipient of this message');
    }

    // Update the message to mark as read
    const updatedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: { read: true },
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

    return updatedMessage;
  }

  async getRecentChats(userId: string) {
    // Get all users with whom the current user has exchanged messages
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        channelId: null, // Direct messages only
      },
      orderBy: {
        createdAt: 'desc',
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
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Create a map of users and their last message
    const userChatsMap = new Map();
    
    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
      
      // Skip if otherUserId is null (could happen if a user was deleted)
      if (!otherUserId) continue;
      
      // Only add the first (most recent) message for each user
      if (!userChatsMap.has(otherUserId)) {
        const otherUser = message.senderId === userId ? message.receiver : message.sender;
        
        userChatsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            isFromCurrentUser: message.senderId === userId,
            read: message.read,
          },
        });
      }
    }

    // Convert map to array
    return Array.from(userChatsMap.values());
  }
} 