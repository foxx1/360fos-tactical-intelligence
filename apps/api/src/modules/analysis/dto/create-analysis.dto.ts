import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

enum AnalysisTypeDto { OUR_TEAM = "OUR_TEAM", OPPONENT = "OPPONENT" }
enum TacticalPhaseDto {
  IN_POSSESSION = "IN_POSSESSION",
  OUT_OF_POSSESSION = "OUT_OF_POSSESSION",
  ATTACKING_TRANSITION = "ATTACKING_TRANSITION",
  DEFENSIVE_TRANSITION = "DEFENSIVE_TRANSITION",
  SET_PIECE = "SET_PIECE"
}
enum FindingTypeDto { STRENGTH = "STRENGTH", WEAKNESS = "WEAKNESS" }
enum PriorityLevelDto { CRITICAL = "CRITICAL", HIGH = "HIGH", MEDIUM = "MEDIUM", LOW = "LOW" }

export class CreateAnalysisDto {
  @IsUUID() matchId!: string;
  @IsEnum(AnalysisTypeDto) type!: AnalysisTypeDto;
  @IsEnum(TacticalPhaseDto) phase!: TacticalPhaseDto;
  @IsString() subPhase!: string;
  @IsString() behaviour!: string;
  @IsOptional() @IsString() evidence?: string;
  @IsOptional() @IsInt() @Min(1) frequency?: number;
  @IsOptional() @Min(0) @Max(100) successPct?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) impact?: number;
  @IsOptional() @IsEnum(FindingTypeDto) findingType?: FindingTypeDto;
  @IsOptional() @IsEnum(PriorityLevelDto) priority?: PriorityLevelDto;
  @IsOptional() @IsString() videoRef?: string;
}
