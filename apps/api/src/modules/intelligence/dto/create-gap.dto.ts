import { GapType, PriorityLevel } from "@prisma/client";
import { IsEnum, IsOptional, IsString } from "class-validator";

export class CreateGapDto {
  @IsEnum(GapType) type!: GapType;
  @IsOptional() @IsString() ourStrength?: string;
  @IsOptional() @IsString() ourWeakness?: string;
  @IsOptional() @IsString() opponentStrength?: string;
  @IsOptional() @IsString() opponentWeakness?: string;
  @IsString() interaction!: string;
  @IsOptional() @IsString() opportunity?: string;
  @IsOptional() @IsString() threat?: string;
  @IsOptional() @IsString() tacticalPrinciple?: string;
  @IsOptional() @IsString() playerBehaviour?: string;
  @IsOptional() @IsString() teamBehaviour?: string;
  @IsOptional() @IsString() trainingObjective?: string;
  @IsOptional() @IsString() matchObjective?: string;
  @IsEnum(PriorityLevel) priority!: PriorityLevel;
}
