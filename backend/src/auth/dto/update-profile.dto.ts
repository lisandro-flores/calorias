import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import type { RecentFoodItem } from '../../users/schemas/user.schema';

export class UserProfileDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsIn(['male', 'female'])
  gender?: 'male' | 'female';

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  startWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  currentWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(20)
  @Max(300)
  goalWeight?: number;

  @IsOptional()
  @IsIn(['sedentary', 'light', 'moderate', 'active', 'very_active'])
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

  @IsOptional()
  @IsNumber()
  @Min(500)
  @Max(10000)
  calorieGoalOverride?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  proteinGoalOverride?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  waterGoal?: number;

  @IsOptional()
  @IsArray()
  recentFoods?: RecentFoodItem[];
}

export class UpdateProfileDto {
  @ValidateNested()
  @Type(() => UserProfileDto)
  profile: UserProfileDto;

  @IsOptional()
  @IsArray()
  recentFoods?: RecentFoodItem[];
}
