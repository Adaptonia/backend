import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtWrapperService } from './jwt.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt.guard';

@Module({
  imports: [
    JwtModule.register({})  // No config here, secrets are passed during sign/verify
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtWrapperService, JwtStrategy,JwtAuthGuard],
  exports: [JwtWrapperService]
})
export class AuthModule {}
