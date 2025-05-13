import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { CreateGoalDto, GoalCategory } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  create(
    @GetUser('id') userId: string,
    @Body() createGoalDto: CreateGoalDto
  ) {
    return this.goalsService.create(userId, createGoalDto);
  }

  @Get()
  findAll(
    @GetUser('id') userId: string,
    @Query('category') category?: GoalCategory
  ) {
    return this.goalsService.findAll(userId, category);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ) {
    return this.goalsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() updateGoalDto: UpdateGoalDto
  ) {
    return this.goalsService.update(id, userId, updateGoalDto);
  }

  @Patch(':id/toggle-complete')
  toggleComplete(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ) {
    return this.goalsService.toggleComplete(id, userId);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @GetUser('id') userId: string
  ) {
    return this.goalsService.remove(id, userId);
  }
} 