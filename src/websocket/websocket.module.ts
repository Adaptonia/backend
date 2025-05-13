import { Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { ChannelModule } from '../channel/channel.module';
import { ChatGateway } from './gateways/chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    ChatModule,
    ChannelModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [ChatGateway],
  exports: [],
})
export class WebsocketModule {} 