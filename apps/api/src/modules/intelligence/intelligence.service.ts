import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateGapDto } from "./dto/create-gap.dto";

@Injectable()
export class IntelligenceService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMatchAccess(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true },
    });
    if (!match) throw new NotFoundException("Match not found");
  }

  createGap(matchId: string, dto: CreateGapDto) {
    return this.prisma.tacticalGap.create({ data: { matchId, ...dto } });
  }

  findGaps(matchId: string) {
    return this.prisma.tacticalGap.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  async strengthsWeaknesses(matchId: string) {
    const analyses = await this.prisma.analysis.findMany({
      where: { matchId, findingType: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    const findings = analyses.map((item) => {
      const success = item.successPct ?? 50;
      const impact = item.impact ?? 3;
      const frequency = item.frequency ?? 1;
      const score = item.findingType === "STRENGTH"
        ? frequency * impact * (success / 100)
        : frequency * impact * ((100 - success) / 100);
      return {
        id: item.id, type: item.findingType, analysisType: item.type, phase: item.phase,
        subPhase: item.subPhase, behaviour: item.behaviour, frequency,
        successPct: item.successPct, impact, score: Number(score.toFixed(2)),
        priority: item.priority, videoRef: item.videoRef,
      };
    });
    return {
      strengths: findings.filter((item) => item.type === "STRENGTH").sort((a, b) => b.score - a.score),
      weaknesses: findings.filter((item) => item.type === "WEAKNESS").sort((a, b) => b.score - a.score),
    };
  }

  async summarize(matchId: string) {
    const [analyses, evidence, gaps, priorities] = await Promise.all([
      this.prisma.analysis.count({ where: { matchId } }),
      this.prisma.evidence.count({ where: { matchId } }),
      this.prisma.tacticalGap.count({ where: { matchId } }),
      this.prisma.trainingPriority.count({ where: { matchId } }),
    ]);
    return { analysisItems: analyses, evidenceItems: evidence, tacticalGaps: gaps, trainingPriorities: priorities };
  }

  async generateFromEvidence(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    const evidence = await this.prisma.evidence.findMany({ where: { matchId }, orderBy: { minute: "asc" } });
    if (!evidence.length) {
      return { generatedAnalyses: 0, generatedGaps: 0, generatedPriorities: 0, message: "Add evidence before generating intelligence." };
    }

    const negative = /error|failed|failure|loss|lost|slow|late|poor|missed|conceded|wrong|bad|turnover|mistake|space conceded|out of position/i;
    const positive = /successful|success|effective|won|created|progress|penetrat|recover|press|counter.?press|overload|chance|shot|goal|excellent|quick/i;
    const groups = new Map<string, typeof evidence>();

    for (const item of evidence) {
      const key = [item.analysisType, item.phase, item.event.trim().toLowerCase(), item.zone?.trim().toLowerCase() ?? ""].join("|");
      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }

    let generatedAnalyses = 0;
    for (const [key, group] of groups) {
      const parts = key.split("|");
      const analysisType = parts[0];
      const phase = parts[1];
      const marker = "evidence-engine:" + Buffer.from(key).toString("base64url");
      const exists = await this.prisma.analysis.findFirst({ where: { matchId, videoRef: marker } });
      if (exists) continue;

      const text = group.map((x) => x.event + " " + x.note).join(" ");
      const negativeHits = (text.match(negative) ?? []).length;
      const positiveHits = (text.match(positive) ?? []).length;
      const findingType = negativeHits > positiveHits ? "WEAKNESS" : "STRENGTH";
      const impact = Math.max(1, Math.min(5, Math.round(group.reduce((sum, x) => sum + (x.impact ?? 3), 0) / group.length)));
      const successPct = findingType === "STRENGTH" ? 75 : 25;
      const frequency = group.length;
      const score = frequency * impact * (findingType === "STRENGTH" ? successPct / 100 : (100 - successPct) / 100);
      const priority = score >= 12 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";

      await this.prisma.analysis.create({
        data: {
          matchId,
          type: analysisType as "OUR_TEAM" | "OPPONENT",
          phase: phase as any,
          subPhase: group[0].zone ?? "General",
          behaviour: group[0].event,
          evidence: group.map((x) => "@" + x.minute + " " + x.note).join(" | "),
          frequency,
          successPct,
          impact,
          findingType,
          priority,
          videoRef: marker,
        },
      });
      generatedAnalyses++;
    }

    const analyses = await this.prisma.analysis.findMany({ where: { matchId, findingType: { not: null } } });
    const weight = (x: any) => (x.impact ?? 0) * (x.frequency ?? 1);
    const ourStrengths = analyses.filter((x) => x.type === "OUR_TEAM" && x.findingType === "STRENGTH").sort((a,b) => weight(b) - weight(a)).slice(0,3);
    const ourWeaknesses = analyses.filter((x) => x.type === "OUR_TEAM" && x.findingType === "WEAKNESS").sort((a,b) => weight(b) - weight(a)).slice(0,3);
    const oppStrengths = analyses.filter((x) => x.type === "OPPONENT" && x.findingType === "STRENGTH").sort((a,b) => weight(b) - weight(a)).slice(0,3);
    const oppWeaknesses = analyses.filter((x) => x.type === "OPPONENT" && x.findingType === "WEAKNESS").sort((a,b) => weight(b) - weight(a)).slice(0,3);

    let generatedGaps = 0;
    const gapPairs = [
      ...ourStrengths.flatMap((s) => oppWeaknesses.slice(0,1).map((w) => ({
        type: "OPPORTUNITY" as const, s, w,
        title: "Use " + s.behaviour + " against opponent " + w.behaviour,
      }))),
      ...ourWeaknesses.flatMap((w) => oppStrengths.slice(0,1).map((s) => ({
        type: "THREAT" as const, s, w,
        title: "Protect against opponent " + s.behaviour + " with our " + w.behaviour,
      }))),
    ].slice(0,6);

    for (const pair of gapPairs) {
      const exists = await this.prisma.tacticalGap.findFirst({ where: { matchId, interaction: pair.title } });
      if (exists) continue;
      await this.prisma.tacticalGap.create({
        data: {
          matchId, type: pair.type,
          ourStrength: pair.type === "OPPORTUNITY" ? pair.s.behaviour : undefined,
          ourWeakness: pair.type === "THREAT" ? pair.w.behaviour : undefined,
          opponentWeakness: pair.type === "OPPORTUNITY" ? pair.w.behaviour : undefined,
          opponentStrength: pair.type === "THREAT" ? pair.s.behaviour : undefined,
          interaction: pair.title,
          opportunity: pair.type === "OPPORTUNITY" ? pair.title : undefined,
          threat: pair.type === "THREAT" ? pair.title : undefined,
          tacticalPrinciple: pair.type === "OPPORTUNITY" ? "Exploit the identified opponent weakness." : "Protect the vulnerable area and control the opponent strength.",
          trainingObjective: pair.type === "OPPORTUNITY"
            ? "Train " + pair.s.behaviour + " to repeatedly attack " + pair.w.behaviour + "."
            : "Train the team to resist " + pair.s.behaviour + " and improve " + pair.w.behaviour + ".",
          priority: "HIGH",
          status: "OPEN",
        },
      });
      generatedGaps++;
    }

    let generatedPriorities = 0;
    for (const weakness of ourWeaknesses.slice(0,3)) {
      const marker = "evidence-training:" + weakness.id;
      const exists = await this.prisma.trainingPriority.findFirst({ where: { matchId, evidence: { contains: marker } } });
      if (exists) continue;
      await this.prisma.trainingPriority.create({
        data: {
          matchId, rank: generatedPriorities + 1, priority: weakness.priority ?? "MEDIUM",
          problem: weakness.behaviour, evidence: marker + " | " + (weakness.evidence ?? ""),
          diagnosis: "Repeated " + weakness.behaviour + " issue identified from " + weakness.frequency + " evidence item(s).",
          objective: "Improve " + weakness.behaviour + " under realistic match pressure.",
          exerciseType: "Game-based tactical exercise",
          constraint: "Recreate the match context and require the target behaviour within 5 seconds.",
          players: "Relevant unit + opposition", durationMinutes: 12, intensity: "High",
          successKpi: "Target behaviour achieved consistently in representative repetitions.",
          matchObjective: "Transfer improved " + weakness.behaviour + " into the match model.",
        },
      });
      generatedPriorities++;
    }

    return { generatedAnalyses, generatedGaps, generatedPriorities, message: "Evidence processed into tactical intelligence." };
  }
}
