import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete, 
  Patch, 
  UseGuards, 
  Req,
  ForbiddenException,
  HttpCode
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { AddChannelMemberDto } from './dto/add-channel-member.dto';
import { CreateMessageDto } from '../chat/dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('channels')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async createChannel(@Req() req, @Body() createChannelDto: CreateChannelDto) {
    const userId = req.user.id;
    return this.channelService.createChannel(createChannelDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':channelId/invite')
  async generateInviteCode(@Req() req, @Param('channelId') channelId: string) {
    const userId = req.user.id;
    const inviteCode = await this.channelService.generateChannelInviteCode(channelId, userId);
    return { inviteCode };
  }

  @UseGuards(JwtAuthGuard)
  @Post('join-by-invite')
  async joinByInviteCode(@Req() req, @Body() body: { inviteCode: string }) {
    const userId = req.user.id;
    const { inviteCode } = body;
    return this.channelService.joinChannelByInviteCode(inviteCode, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserChannels(@Req() req) {
    const userId = req.user.id;
    return this.channelService.getUserChannels(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('public')
  async getPublicChannels() {
    return this.channelService.getPublicChannels();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':channelId')
  async getChannelById(@Req() req, @Param('channelId') channelId: string) {
    const userId = req.user.id;
    return this.channelService.getChannelById(channelId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':channelId')
  async updateChannelInfo(
    @Req() req, 
    @Param('channelId') channelId: string, 
    @Body() updateData: Partial<CreateChannelDto>
  ) {
    const userId = req.user.id;
    return this.channelService.updateChannelInfo(channelId, updateData, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':channelId/members')
  async addChannelMember(
    @Req() req, 
    @Param('channelId') channelId: string, 
    @Body() addMemberDto: AddChannelMemberDto
  ) {
    const userId = req.user.id;
    // Set channelId from path param
    addMemberDto.channelId = channelId;
    return this.channelService.addChannelMember(addMemberDto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':channelId/members/:memberId')
  async removeChannelMember(
    @Req() req, 
    @Param('channelId') channelId: string,
    @Param('memberId') memberId: string
  ) {
    const userId = req.user.id;
    return this.channelService.removeChannelMember(channelId, memberId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':channelId/messages')
  async getChannelMessages(@Req() req, @Param('channelId') channelId: string) {
    const userId = req.user.id;
    return this.channelService.getChannelMessages(channelId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':channelId/messages')
  async sendChannelMessage(
    @Req() req, 
    @Param('channelId') channelId: string, 
    @Body() createMessageDto: CreateMessageDto
  ) {
    // Set senderId and channelId
    createMessageDto.senderId = req.user.id;
    createMessageDto.channelId = channelId;
    return this.channelService.sendChannelMessage(createMessageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':channelId/join')
  @HttpCode(200)
  async joinPublicChannel(
    @Req() req, 
    @Param('channelId') channelId: string
  ) {
    console.log(`User ${req.user.id} attempting to join channel ${channelId}`);
    try {
      const result = await this.channelService.joinPublicChannel(channelId, req.user.id);
      console.log('Join successful:', result);
      return result;
    } catch (error) {
      console.error('Join failed:', error);
      throw error;
    }
  }

  // Alternative join endpoint with a different URL pattern
  @UseGuards(JwtAuthGuard)
  @Post('join/:channelId')
  @HttpCode(200)
  async joinChannelAlternative(
    @Req() req, 
    @Param('channelId') channelId: string
  ) {
    console.log(`User ${req.user.id} attempting to join channel ${channelId} (alternative endpoint)`);
    try {
      const result = await this.channelService.joinPublicChannel(channelId, req.user.id);
      console.log('Join successful (alternative):', result);
      return result;
    } catch (error) {
      console.error('Join failed (alternative):', error);
      throw error;
    }
  }

  // Simple join endpoint that uses query parameters
  @UseGuards(JwtAuthGuard)
  @Post('join-channel')
  @HttpCode(200)
  async joinChannelSimple(
    @Req() req, 
    @Body() body: { channelId: string }
  ) {
    const { channelId } = body;
    console.log(`[SIMPLE JOIN] User ${req.user.id} attempting to join channel ${channelId}`);
    try {
      const result = await this.channelService.joinPublicChannel(channelId, req.user.id);
      console.log('[SIMPLE JOIN] Successful:', result);
      return result;
    } catch (error) {
      console.error('[SIMPLE JOIN] Failed:', error);
      throw error;
    }
  }
} 