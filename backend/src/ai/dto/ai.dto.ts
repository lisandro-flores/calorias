import { IsArray, IsObject, IsString, MaxLength, MinLength } from 'class-validator';

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
