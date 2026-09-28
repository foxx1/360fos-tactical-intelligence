import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { CreateGapDto } from "./dto/create-gap.dto";
import { UpdateGapDto } from "./dto/update-gap.dto";
import { IntelligenceService } from "./intelligence.service";

@Controller("matches/:matchId/intelligence")
export class IntelligenceController {
  constructor(private readonly service: IntelligenceService) {}

  @Get("summary")
  async summary(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.summarize(req.user.id, matchId) };
  }

  @Get("strengths-weaknesses")
  async strengthsWeaknesses(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.strengthsWeaknesses(req.user.id, matchId) };
  }

  @Get("matrix")
  async matrix(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.matrix(req.user.id, matchId) };
  }

  @Get("gaps")
  async findGaps(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.findGaps(req.user.id, matchId) };
  }

  @Post("generate")
  async generate(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.generateFromEvidence(req.user.id, matchId) };
  }

  @Post("gaps")
  async createGap(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateGapDto) {
    return { success: true, data: await this.service.createGap(req.user.id, matchId, dto) };
  }

  @Patch("gaps/:gapId")
  async updateGap(@Req() req: any, @Param("matchId") matchId: string, @Param("gapId") gapId: string, @Body() dto: UpdateGapDto) {
    return { success: true, data: await this.service.updateGap(req.user.id, matchId, gapId, dto) };
  }
}
