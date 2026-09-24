import { TrainingExercisePhase } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateTrainingExerciseDto {
  @IsOptional() @IsInt() @Min(1) exerciseOrder?: number;
  @IsEnum(TrainingExercisePhase) phase!: TrainingExercisePhase;
  @IsString() title!: string;
  @IsString() objective!: string;
  @IsOptional() @IsString() organization?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsString() players?: string;
  @IsOptional() @IsString() constraints?: string;
  @IsOptional() @IsString() coachingPoints?: string;
  @IsOptional() @IsString() successKpi?: string;
  @IsOptional() @IsString() progression?: string;
  @IsOptional() @IsString() regression?: string;
  @IsOptional() @IsString() matchBehaviour?: string;
  @IsOptional() @IsString() trainingPriorityId?: string;
  @IsOptional() @IsString() tacticalGapId?: string;
}
