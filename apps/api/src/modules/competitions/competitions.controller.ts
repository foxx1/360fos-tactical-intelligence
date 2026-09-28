import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { IsString, MinLength } from "class-validator";
import { CompetitionsService } from "./competitions.service";

class CreateCompetitionDto {
  @IsString()
  @MinLength(2)
  name!: string;
}

@Controller("competitions")
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Get()
  async findAll(@Req() req: any) {
    return { success: true, data: await this.competitionsService.list(req.user.id) };
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateCompetitionDto) {
    return {
      success: true,
      data: await this.competitionsService.create(req.user.id, dto.name.trim()),
    };
  }
}
