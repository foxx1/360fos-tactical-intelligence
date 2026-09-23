import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateGapDto } from "./dto/create-gap.dto";

@Injectable()
export class IntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  createGap(matchId: string, dto: CreateGapDto) {
    return this.prisma.tacticalGap.create({
      data: { matchId, ...dto }
    });
  }

  findGaps(matchId: string) {
    return this.prisma.tacticalGap.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }]
    });
  }

  async strengthsWeaknesses(matchId: string) {
    const analyses = await this.prisma.analysis.findMany({
      where: { matchId, findingType: { not: null } },
      orderBy: { createdAt: "desc" }
    });

    const findings = analyses.map((item) => {
      const success = item.successPct ?? 50;
      const impact = item.impact ?? 3;
      const frequency = item.frequency ?? 1;

      const score =
        item.findingType === "STRENGTH"
          ? frequency * impact * (success / 100)
          : frequency * impact * ((100 - success) / 100);

      return {
        id: item.id,
        type: item.findingType,
        phase: item.phase,
        subPhase: item.subPhase,
        behaviour: item.behaviour,
        frequency,
        successPct: item.successPct,
        impact,
        score: Number(score.toFixed(2)),
        priority: item.priority,
        videoRef: item.videoRef
      };
    });

    return {
      strengths: findings
        .filter((item) => item.type === "STRENGTH")
        .sort((a, b) => b.score - a.score),
      weaknesses: findings
        .filter((item) => item.type === "WEAKNESS")
        .sort((a, b) => b.score - a.score)
    };
  }

  async summarize(matchId: string) {
    const [analyses, evidence, gaps, priorities] = await Promise.all([
      this.prisma.analysis.count({ where: { matchId } }),
      this.prisma.evidence.count({ where: { matchId } }),
      this.prisma.tacticalGap.count({ where: { matchId } }),
      this.prisma.trainingPriority.count({ where: { matchId } })
    ]);

    return {
      analysisItems: analyses,
      evidenceItems: evidence,
      tacticalGaps: gaps,
      trainingPriorities: priorities
    };
  }
}
