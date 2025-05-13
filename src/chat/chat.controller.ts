import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get('messages/:otherUserId')
  async getDirectMessages(@Req() req, @Param('otherUserId') otherUserId: string) {
    const userId = req.user.id;
    return this.chatService.getDirectMessages(userId, otherUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages')
  async sendDirectMessage(@Req() req, @Body() createMessageDto: CreateMessageDto) {
    // Set the senderId from the authenticated user
    createMessageDto.senderId = req.user.id;
    return this.chatService.sendDirectMessage(createMessageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('messages/read/:otherUserId')
  async markMessagesAsRead(@Req() req, @Param('otherUserId') otherUserId: string) {
    const userId = req.user.id;
    return this.chatService.markMessagesAsRead(userId, otherUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('recent')
  async getRecentChats(@Req() req) {
    const userId = req.user.id;
    return this.chatService.getRecentChats(userId);
  }
} 