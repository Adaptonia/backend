import { Controller, Get, Param, Post, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('promote-admin')
  async promoteToAdmin(@Body() { email }: { email: string }) {
    if (!email) {
      throw new ForbiddenException('Email is required');
    }
    
    return this.userService.promoteToAdmin(email);
  }
}
