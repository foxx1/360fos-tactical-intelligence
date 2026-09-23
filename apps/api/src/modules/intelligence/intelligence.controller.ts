import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateGapDto } from "./dto/create-gap.dto";
import { IntelligenceService } from "./intelligence.service";

@Controller("matches/:matchId/intelligence")
export class IntelligenceController {
  constructor(private readonly service: IntelligenceService) {}

  @Get("summary")
  summary(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.summarize(matchId) };
  }

  @Get("strengths-weaknesses")
  strengthsWeaknesses(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.strengthsWeaknesses(matchId) };
  }

  @Get("gaps")
  findGaps(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.findGaps(matchId) };
  }

  @Post("gaps")
  createGap(@Param("matchId") matchId: string, @Body() dto: CreateGapDto) {
    return { success: true, data: this.service.createGap(matchId, dto) };
  }
}
