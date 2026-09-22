import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CreateMatchDto } from "./dto/create-match.dto";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll(@Query("teamId") teamId?: string) {
    return { success: true, data: this.matchesService.findAll(teamId) };
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return { success: true, data: this.matchesService.findOne(id) };
  }

  @Post()
  create(@Body() dto: CreateMatchDto) {
    return { success: true, data: this.matchesService.create(dto) };
  }
}
