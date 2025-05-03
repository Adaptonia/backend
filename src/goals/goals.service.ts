import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto, GoalCategory } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createGoalDto: CreateGoalDto) {
    const { 
      title,
      description,
      category,
      deadline,
      location,
      tags,
      reminderDate,
      isCompleted
    } = createGoalDto;

    return this.prisma.goal.create({
      data: {
        title,
        description,
        category,
        deadline: deadline ? new Date(deadline) : null,
        location,
        tags,
        reminderDate: reminderDate ? new Date(reminderDate) : null,
        isCompleted: isCompleted || false,
        userId
      }
    });
  }

  async findAll(userId: string, category?: GoalCategory) {
    const filter: any = { userId };
    
    if (category) {
      filter.category = category;
    }
    
    return this.prisma.goal.findMany({
      where: filter,
      orderBy: { 
        createdAt: 'desc'
      }
    });
  }

  async findOne(id: string, userId: string) {
    const goal = await this.prisma.goal.findFirst({
      where: { 
        id,
        userId
      }
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    return goal;
  }

  async update(id: string, userId: string, updateGoalDto: UpdateGoalDto) {
    // Check if goal exists
    await this.findOne(id, userId);

    const { 
      deadline,
      reminderDate,
      ...restData
    } = updateGoalDto;

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...restData,
        deadline: deadline ? new Date(deadline) : undefined,
        reminderDate: reminderDate ? new Date(reminderDate) : undefined,
      }
    });
  }

  async toggleComplete(id: string, userId: string) {
    const goal = await this.findOne(id, userId);
    
    return this.prisma.goal.update({
      where: { id },
      data: {
        isCompleted: !goal.isCompleted
      }
    });
  }

  async remove(id: string, userId: string) {
    // Check if goal exists
    await this.findOne(id, userId);
    
    return this.prisma.goal.delete({
      where: { id }
    });
  }
} 