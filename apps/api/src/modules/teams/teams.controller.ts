import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { IsArray, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { TeamsService } from "./teams.service";

class CreateTeamDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional() @IsString()
  shortName?: string;

  @IsOptional() @IsString()
  country?: string;

  @IsOptional() @IsString()
  clubName?: string;

  @IsOptional() @IsIn(["MEN", "WOMEN", "MIXED"])
  gender?: "MEN" | "WOMEN" | "MIXED";

  @IsOptional() @IsIn(["FIRST_TEAM", "U23", "U21", "U20", "U19", "U18", "U17", "U16", "U15", "U14", "ACADEMY", "OTHER"])
  category?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  aliases?: string[];

  @IsOptional() @IsString() @MinLength(2)
  seasonName?: string;

  @IsOptional() @IsString()
  competitionId?: string;

  @IsOptional() @IsString() @MinLength(2)
  competitionName?: string;
}

@Controller("teams")
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  async list(@Req() req: any) {
    return { success: true, data: await this.service.list(req.user.id) };
  }

  @Get(":id")
  async get(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: await this.service.get(req.user.id, id) };
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTeamDto) {
    return { success: true, data: await this.service.create(req.user.id, dto) };
  }
}
