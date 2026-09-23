import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { AnalysisService } from "./analysis.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";

@Controller("matches/:matchId/analysis")
export class AnalysisController {
  constructor(private readonly service: AnalysisService) {}

  @Get()
  findByMatch(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.findByMatch(matchId) };
  }

  @Post()
  create(@Param("matchId") matchId: string, @Body() dto: CreateAnalysisDto) {
    return { success: true, data: this.service.create({ ...dto, matchId }) };
  }
}
