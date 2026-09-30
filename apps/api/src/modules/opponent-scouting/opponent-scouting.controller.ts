import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { OpponentScoutingService } from "./opponent-scouting.service";

@Controller("matches/:matchId/opponent-scouting")
export class OpponentScoutingController {
  constructor(private readonly service: OpponentScoutingService) {}

  @Get()
  async getWorkspace(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.getWorkspace(req.user.id, matchId) };
  }

  @Post("matches")
  async addMatch(@Req() req: any, @Param("matchId") matchId: string, @Body() body: any) {
    return { success: true, data: await this.service.addScoutingMatch(req.user.id, matchId, body) };
  }

  @Get("matches/:scoutingMatchId")
  async getMatch(@Req() req: any, @Param("matchId") matchId: string, @Param("scoutingMatchId") scoutingMatchId: string) {
    return { success: true, data: await this.service.getScoutingMatchDetail(req.user.id, matchId, scoutingMatchId) };
  }

  @Post("matches/:scoutingMatchId/evidence")
  async addEvidence(@Req() req: any, @Param("matchId") matchId: string, @Param("scoutingMatchId") scoutingMatchId: string, @Body() body: any) {
    return { success: true, data: await this.service.addEvidence(req.user.id, matchId, scoutingMatchId, body) };
  }

  @Get("summary")
  async summary(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.getSummary(req.user.id, matchId) };
  }
}
