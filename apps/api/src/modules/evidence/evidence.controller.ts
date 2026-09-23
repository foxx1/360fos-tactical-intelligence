import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";
import { EvidenceService } from "./evidence.service";

@Controller("matches/:matchId/evidence")
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}
  @Get()
  findByMatch(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.findByMatch(req.user.id, matchId) };
  }
  @Post()
  create(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateEvidenceDto) {
    return { success: true, data: this.service.create(req.user.id, matchId, dto) };
  }
}
