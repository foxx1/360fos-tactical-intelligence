import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateAnalysisDto } from "./dto/create-analysis.dto";

@Injectable()
export class AnalysisService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateAnalysisDto) {
    return this.prisma.analysis.create({
      data: {
        matchId: dto.matchId,
        type: dto.type,
        phase: dto.phase,
        subPhase: dto.subPhase,
        behaviour: dto.behaviour,
        evidence: dto.evidence,
        frequency: dto.frequency ?? 1,
        successPct: dto.successPct,
        impact: dto.impact,
        findingType: dto.findingType,
        priority: dto.priority,
        videoRef: dto.videoRef
      }
    });
  }

  findByMatch(matchId: string) {
    return this.prisma.analysis.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    });
  }
}
