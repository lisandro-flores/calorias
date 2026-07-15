import { IsArray, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ParseMealDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  text: string;
}

export class CoachAdviceDto {
  @IsObject()
  profile: Record<string, unknown>;

  @IsArray()
  meals: unknown[];
}

export class AnalyzeImageDto {
  @IsString()
  @MinLength(100) // base64 image will always be long
  image: string;

  @IsOptional()
  @IsString()
  mealType?: string;
}
