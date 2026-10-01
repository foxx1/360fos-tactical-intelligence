import { Controller, Get, Param, Req } from "@nestjs/common";
import { MatchPlanService } from "./match-plan.service";

@Controller("matches/:matchId/match-plan")
export class MatchPlanController {
  constructor(private readonly service: MatchPlanService) {}

  @Get()
  async get(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.build(req.user.id, matchId) };
  }
}
