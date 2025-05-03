import { Module } from '@nestjs/common';
import { GoalsController } from './goals.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GoalsService } from './goals.service';

@Module({
  controllers: [GoalsController],
  providers: [GoalsService, PrismaService],
  exports: [GoalsService]
})
export class GoalsModule {} 