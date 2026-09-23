import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

enum TacticalPhaseDto {
  IN_POSSESSION = "IN_POSSESSION",
  OUT_OF_POSSESSION = "OUT_OF_POSSESSION",
  ATTACKING_TRANSITION = "ATTACKING_TRANSITION",
  DEFENSIVE_TRANSITION = "DEFENSIVE_TRANSITION",
  SET_PIECE = "SET_PIECE"
}

export class CreateEvidenceDto {
  @IsNumber() @Min(0) minute!: number;
  @IsEnum(TacticalPhaseDto) phase!: TacticalPhaseDto;
  @IsString() event!: string;
  @IsOptional() @IsString() zone?: string;
  @IsOptional() @IsNumber() @Min(1) @Max(5) impact?: number;
  @IsString() note!: string;
  @IsOptional() @IsString() videoRef?: string;
}
