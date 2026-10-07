import { Controller, Get, Param, Req } from "@nestjs/common";
import { ProfessionalReportingService } from "./professional-reporting.service";

@Controller("matches/:matchId/report")
export class ProfessionalReportingController {
  constructor(private readonly service: ProfessionalReportingService) {}

  @Get()
  async getReport(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.getReport(req.user.id, matchId) };
  }
}
