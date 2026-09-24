import { PriorityLevel } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateTrainingPriorityDto {
  @IsOptional() @IsInt() @Min(1) rank?: number;
  @IsEnum(PriorityLevel) priority!: PriorityLevel;
  @IsString() problem!: string;
  @IsOptional() @IsString() evidence?: string;
  @IsOptional() @IsString() diagnosis?: string;
  @IsString() objective!: string;
  @IsOptional() @IsString() exerciseType?: string;
  @IsOptional() @IsString() constraint?: string;
  @IsOptional() @IsString() players?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() intensity?: string;
  @IsOptional() @IsString() successKpi?: string;
  @IsOptional() @IsString() matchObjective?: string;
  @IsOptional() @IsString() sessionDay?: string;
}
