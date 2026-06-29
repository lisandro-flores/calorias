import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class SyncEntryDto {
  @IsDateString()
  date: string;

  @IsArray()
  meals: unknown[];

  @IsInt()
  @Min(0)
  @Max(50)
  waterGlasses: number;

  @IsOptional()
  @IsDateString()
  clientUpdatedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  expectedVersion?: number;
}
