import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { TrainingSessionStatus } from "@prisma/client";

export class CreateTrainingSessionDto {
  @IsString() title!: string;
  @IsOptional() @IsString() sessionDay?: string;
  @IsOptional() @IsDateString() sessionDate?: string;
  @IsOptional() @IsInt() @Min(1) totalDurationMinutes?: number;
  @IsOptional() @IsString() intensity?: string;
  @IsString() objective!: string;
  @IsOptional() @IsString() matchObjective?: string;
  @IsOptional() @IsEnum(TrainingSessionStatus) status?: TrainingSessionStatus;
  @IsOptional() @IsString() coachNotes?: string;
}
