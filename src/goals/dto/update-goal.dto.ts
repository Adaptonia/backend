import { IsEnum, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';
import { GoalCategory } from './create-goal.dto';

export class UpdateGoalDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalCategory)
  @IsOptional()
  category?: GoalCategory;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsDateString()
  @IsOptional()
  reminderDate?: string;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;
} 