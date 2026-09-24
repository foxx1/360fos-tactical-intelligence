import { Body, Controller, Get, Param, Post, Query, Req } from "@nestjs/common";
import { CreateMatchDto } from "./dto/create-match.dto";
import { MatchesService } from "./matches.service";

@Controller("matches")
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get()
  findAll(@Req() req: any, @Query("teamId") teamId?: string) {
    return { success: true, data: this.matchesService.findAll(req.user.id, teamId) };
  }

  @Get(":id")
  findOne(@Req() req: any, @Param("id") id: string) {
    return { success: true, data: this.matchesService.findOne(req.user.id, id) };
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateMatchDto) {
    return { success: true, data: this.matchesService.create(req.user.id, dto) };
  }
}
