import { GapType, PriorityLevel } from "@prisma/client";
import { IsEnum, IsIn, IsOptional, IsString } from "class-validator";

export class UpdateGapDto {
  @IsOptional() @IsEnum(GapType) type?: GapType;
  @IsOptional() @IsString() ourStrength?: string;
  @IsOptional() @IsString() ourWeakness?: string;
  @IsOptional() @IsString() opponentStrength?: string;
  @IsOptional() @IsString() opponentWeakness?: string;
  @IsOptional() @IsString() interaction?: string;
  @IsOptional() @IsString() opportunity?: string;
  @IsOptional() @IsString() threat?: string;
  @IsOptional() @IsString() tacticalPrinciple?: string;
  @IsOptional() @IsString() playerBehaviour?: string;
  @IsOptional() @IsString() teamBehaviour?: string;
  @IsOptional() @IsString() trainingObjective?: string;
  @IsOptional() @IsString() matchObjective?: string;
  @IsOptional() @IsEnum(PriorityLevel) priority?: PriorityLevel;
  @IsOptional() @IsIn(["OPEN", "REVIEWED", "APPROVED", "REJECTED"]) status?: string;
}
