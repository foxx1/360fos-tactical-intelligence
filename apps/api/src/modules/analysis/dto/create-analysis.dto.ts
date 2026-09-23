import { AnalysisType, FindingType, PriorityLevel, TacticalPhase } from "@prisma/client";
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class CreateAnalysisDto {
  @IsUUID() matchId!: string;
  @IsEnum(AnalysisType) type!: AnalysisType;
  @IsEnum(TacticalPhase) phase!: TacticalPhase;
  @IsString() subPhase!: string;
  @IsString() behaviour!: string;
  @IsOptional() @IsString() evidence?: string;
  @IsOptional() @IsInt() @Min(1) frequency?: number;
  @IsOptional() @Min(0) @Max(100) successPct?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) impact?: number;
  @IsOptional() @IsEnum(FindingType) findingType?: FindingType;
  @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @IsOptional() @IsString() videoRef?: string;
}
