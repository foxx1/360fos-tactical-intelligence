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
