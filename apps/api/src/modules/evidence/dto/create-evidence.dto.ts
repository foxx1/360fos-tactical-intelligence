import { AnalysisType, TacticalPhase } from "@prisma/client";
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateEvidenceDto {
  @IsEnum(AnalysisType) analysisType!: AnalysisType;
  @IsNumber() @Min(0) minute!: number;
  @IsEnum(TacticalPhase) phase!: TacticalPhase;
  @IsString() event!: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(5) impact?: number;
  @IsString() note!: string;
  @IsOptional() @IsString() videoRef?: string;
}
