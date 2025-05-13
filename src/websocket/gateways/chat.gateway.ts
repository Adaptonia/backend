import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Injectable } from '@nestjs/common';
import { ChatService } from '../../chat/chat.service';
import { ChannelService } from '../../channel/channel.service';
import { 
  DirectMessageEvent, 
  ChannelMessageEvent, 
  MessageReadEvent, 
  TypingEvent,
  MessageSentEvent,
  UserOnlineEvent
} from '../events/message.events';
import { JwtService } from '@nestjs/jwt';
import * as cookieParser from 'cookie-parser';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true, // Important: Allow cookies to be sent
  },
  namespace: 'chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers = new Map<string, Socket>();
  
  constructor(
    private readonly chatService: ChatService,
    private readonly channelService: ChannelService,
    private readonly jwtService: JwtService,
  ) {}

  // Handle client connection
  async handleConnection(client: Socket) {
    try {
      // Extract token from cookies
      let token = null;
      
      if (client.handshake.headers.cookie) {
        const cookies = client.handshake.headers.cookie
          .split(';')
          .reduce((cookiesObj, cookie) => {
            const [name, value] = cookie.trim().split('=');
            cookiesObj[name] = decodeURIComponent(value);
            return cookiesObj;
          }, {});
          
        token = cookies['auth-token'];
        this.logger.log(`Found cookie: auth-token=${token ? 'present' : 'missing'}`);
      } else {
        this.logger.log('No cookies found in handshake');
      }
      
      // Fallback to auth object or Authorization header if needed
      if (!token) {
        token = client.handshake.auth.token || 
                client.handshake.headers.authorization?.split(' ')[1];
        this.logger.log(`Fallback token ${token ? 'found' : 'not found'}`);
      }
      
      if (!token) {
        this.logger.warn('Client attempted to connect without token');
        client.disconnect();
        return;
      }

      // Validate token and get user info
      try {
        const decoded = this.jwtService.verify(token);
        const userId = decoded.sub;

        if (!userId) {
          this.logger.warn('Invalid token: no user ID in payload');
          client.disconnect();
          return;
        }

        // Store the user ID in the socket data
        client.data.userId = userId;
        
        // Join user's private room
        client.join(`user:${userId}`);
        
        // Store the connection
        this.connectedUsers.set(userId, client);
        
        // Emit user online status to relevant users
        this.broadcastUserStatus(userId, true);

        // Join channel rooms based on user's memberships
        const userChannels = await this.channelService.getUserChannels(userId);
        userChannels.forEach(channel => {
          client.join(`channel:${channel.id}`);
        });

        this.logger.log(`Client connected: ${userId}`);
      } catch (jwtError) {
        this.logger.error(`JWT verification error: ${jwtError.message}`);
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  // Handle client disconnection
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
      this.broadcastUserStatus(userId, false);
      this.logger.log(`Client disconnected: ${userId}`);
    }
  }

  // Direct message handler
  @SubscribeMessage('send_direct_message')
  async handleDirectMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: DirectMessageEvent,
  ) {
    try {
      const senderId = client.data.userId;
      
      if (!senderId || !payload.receiverId || !payload.content) {
        return { success: false, message: 'Invalid message data' };
      }
      
      // Create a message object for the service
      const createMessageDto = {
        senderId,
        receiverId: payload.receiverId,
        content: payload.content,
      };
      
      // Save message to database
      const message = await this.chatService.sendDirectMessage(createMessageDto);
      
      // Convert to event format and handle type conversions
      const messageEvent: MessageSentEvent = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        receiverId: message.receiverId || undefined,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName || undefined,
          lastName: message.sender.lastName || undefined,
          email: message.sender.email,
        },
      };
      
      // Emit to sender and receiver
      this.server.to(`user:${senderId}`).to(`user:${payload.receiverId}`).emit('message_received', messageEvent);
      
      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error(`Error sending direct message: ${error.message}`);
      return { success: false, message: 'Failed to send message' };
    }
  }

  // Channel message handler
  @SubscribeMessage('send_channel_message')
  async handleChannelMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChannelMessageEvent,
  ) {
    try {
      const senderId = client.data.userId;
      
      if (!senderId || !payload.channelId || !payload.content) {
        return { success: false, message: 'Invalid message data' };
      }
      
      // Create a message object for the service
      const createMessageDto = {
        senderId,
        channelId: payload.channelId,
        content: payload.content,
      };
      
      // Save message to database
      const message = await this.channelService.sendChannelMessage(createMessageDto);
      
      // Convert to event format and handle type conversions
      const messageEvent: MessageSentEvent = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        channelId: message.channelId || undefined,
        createdAt: message.createdAt,
        sender: {
          id: message.sender.id,
          firstName: message.sender.firstName || undefined,
          lastName: message.sender.lastName || undefined,
          email: message.sender.email,
        },
      };
      
      // Emit to all users in the channel
      this.server.to(`channel:${payload.channelId}`).emit('channel_message_received', messageEvent);
      
      return { success: true, messageId: message.id };
    } catch (error) {
      this.logger.error(`Error sending channel message: ${error.message}`);
      return { success: false, message: 'Failed to send message' };
    }
  }

  // Mark message as read handler
  @SubscribeMessage('mark_message_read')
  async handleMarkMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MessageReadEvent,
  ) {
    try {
      const userId = client.data.userId;
      
      if (!userId || !payload.messageId) {
        return { success: false, message: 'Invalid data' };
      }
      
      // Mark message as read in database using the new method
      const updatedMessage = await this.chatService.markMessageAsRead(payload.messageId, userId);
      
      // Notify the message sender that their message was read
      if (updatedMessage.senderId) {
        this.server.to(`user:${updatedMessage.senderId}`).emit('message_read', {
          messageId: updatedMessage.id,
          readAt: new Date(),
        });
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      return { success: false, message: 'Failed to mark message as read' };
    }
  }

  // Typing indicator handler
  @SubscribeMessage('typing')
  handleTypingIndicator(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingEvent,
  ) {
    try {
      const senderId = client.data.userId;
      const userName = payload.userName || 'Anonymous';
      
      if (!senderId || (!payload.receiverId && !payload.channelId)) {
        this.logger.warn('Invalid typing data:', { senderId, payload });
        return { success: false, message: 'Invalid data' };
      }
      
      // For direct messages
      if (payload.receiverId) {
        this.logger.log(`User ${userName} (${senderId}) typing to user ${payload.receiverId}, state: ${payload.isTyping}`);
        this.server.to(`user:${payload.receiverId}`).emit('user_typing', {
          userId: senderId,
          isTyping: payload.isTyping,
          userName
        });
      }
      
      // For channel messages
      if (payload.channelId) {
        this.logger.log(`User ${userName} (${senderId}) typing in channel ${payload.channelId}, state: ${payload.isTyping}`);
        // Emit to everyone in the channel except the sender
        this.server.to(`channel:${payload.channelId}`).emit('user_typing', {
          userId: senderId,
          channelId: payload.channelId,
          isTyping: payload.isTyping,
          userName
        });
      }
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error with typing indicator: ${error.message}`);
      return { success: false, message: 'Failed to send typing indicator' };
    }
  }

  // Join channel room
  @SubscribeMessage('join_channel')
  handleJoinChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string },
  ) {
    try {
      client.join(`channel:${payload.channelId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error joining channel: ${error.message}`);
      return { success: false, message: 'Failed to join channel' };
    }
  }

  // Leave channel room
  @SubscribeMessage('leave_channel')
  handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { channelId: string },
  ) {
    try {
      client.leave(`channel:${payload.channelId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error leaving channel: ${error.message}`);
      return { success: false, message: 'Failed to leave channel' };
    }
  }

  // Helper method to broadcast user online status
  private async broadcastUserStatus(userId: string, isOnline: boolean) {
    // This would require fetching the user's contacts or recent chats
    // to know who should receive this status update
    try {
      // Get the user's recent chats to determine who should receive the status update
      const recentChats = await this.chatService.getRecentChats(userId);
      
      // Extract the list of users who have chatted with this user
      const userIdsToNotify = recentChats.map(chat => chat.user.id);
      
      // Create the status event
      const statusEvent: UserOnlineEvent = {
        userId,
        isOnline,
      };
      
      // Emit the status to all relevant users
      userIdsToNotify.forEach(receiverId => {
        this.server.to(`user:${receiverId}`).emit('user_status_change', statusEvent);
      });
    } catch (error) {
      this.logger.error(`Error broadcasting user status: ${error.message}`);
    }
  }
} 