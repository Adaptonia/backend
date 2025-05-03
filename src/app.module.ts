import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { JwtStrategy } from './auth/strategies/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { UserController } from './user/user.controller';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true
  }),
    PrismaModule, AuthModule, UserModule, GoalsModule],
  controllers: [AppController, UserController],
  providers: [AppService, JwtStrategy,],
})
export class AppModule {}
