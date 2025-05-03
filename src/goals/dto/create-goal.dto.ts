import { IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString, IsBoolean } from 'class-validator';

export enum GoalCategory {
  SCHEDULE = 'SCHEDULE',
  FINANCE = 'FINANCE',
  CAREER = 'CAREER',
  AUDIO_BOOKS = 'AUDIO_BOOKS'
}

export class CreateGoalDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(GoalCategory)
  @IsNotEmpty()
  category: GoalCategory;

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
  isCompleted?: boolean = false;
} 