import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";
import { EvidenceService } from "./evidence.service";

@Controller("matches/:matchId/evidence")
export class EvidenceController {
  constructor(private readonly service: EvidenceService) {}

  @Get()
  findByMatch(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.findByMatch(matchId) };
  }

  @Post()
  create(@Param("matchId") matchId: string, @Body() dto: CreateEvidenceDto) {
    return { success: true, data: this.service.create(matchId, dto) };
  }
}
