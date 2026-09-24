import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateMatchDto {
  @IsUUID() teamId!: string;
  @IsOptional() @IsUUID() seasonId?: string;
  @IsOptional() @IsUUID() competitionId?: string;
  @IsUUID() opponentId!: string;
  @IsDateString() matchDate!: string;
  @IsOptional() @IsString() venue?: string;
  @IsOptional() @IsBoolean() isHome?: boolean;
  @IsOptional() @IsString() formation?: string;
}
