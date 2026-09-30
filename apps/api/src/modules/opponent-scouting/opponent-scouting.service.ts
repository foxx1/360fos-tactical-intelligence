import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class OpponentScoutingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getContext(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true, opponentId: true, opponent: { select: { id: true, name: true } } },
    });
    if (!match) throw new NotFoundException("Upcoming match not found");
    return match;
  }

  private async findScoutingMatch(userId: string, matchId: string, scoutingMatchId: string) {
    const row = await this.prisma.opponentScoutingMatch.findFirst({
      where: {
        id: scoutingMatchId,
        upcomingMatchId: matchId,
        upcomingMatch: { team: { organization: { users: { some: { userId } } } } },
      },
      include: { opponent: true, evidence: { orderBy: { minute: "asc" } } },
    });
    if (!row) throw new NotFoundException("Opponent scouting match not found");
    return row;
  }

  async getWorkspace(userId: string, matchId: string) {
    const context = await this.getContext(userId, matchId);
    const matches = await this.prisma.opponentScoutingMatch.findMany({
      where: { upcomingMatchId: matchId },
      orderBy: { sequence: "asc" },
      include: { _count: { select: { evidence: true } } },
    });
    return {
      upcomingMatch: context,
      capacity: { maxMatches: 5, used: matches.length, remaining: Math.max(0, 5 - matches.length) },
      matches,
    };
  }

  async addScoutingMatch(userId: string, matchId: string, body: any) {
    const context = await this.getContext(userId, matchId);
    const existing = await this.prisma.opponentScoutingMatch.count({ where: { upcomingMatchId: matchId } });
    if (existing >= 5) throw new BadRequestException("A maximum of 5 opponent scouting matches is supported.");

    const matchDate = new Date(body.matchDate);
    if (!body.externalOpponentName || Number.isNaN(matchDate.getTime())) {
      throw new BadRequestException("External opponent name and match date are required.");
    }

    return this.prisma.opponentScoutingMatch.create({
      data: {
        upcomingMatchId: matchId,
        opponentId: context.opponentId,
        opponentName: context.opponent.name,
        externalOpponentName: body.externalOpponentName,
        matchDate,
        opponentScore: body.opponentScore == null ? undefined : Number(body.opponentScore),
        externalScore: body.externalScore == null ? undefined : Number(body.externalScore),
        opponentHome: body.opponentHome ?? true,
        videoRef: body.videoRef || undefined,
        notes: body.notes || undefined,
        sequence: existing + 1,
      },
    });
  }

  async getScoutingMatchDetail(userId: string, matchId: string, scoutingMatchId: string) {
    return this.findScoutingMatch(userId, matchId, scoutingMatchId);
  }

  async addEvidence(userId: string, matchId: string, scoutingMatchId: string, body: any) {
    await this.findScoutingMatch(userId, matchId, scoutingMatchId);
    if (body.minute == null || !body.phase || !body.note) {
      throw new BadRequestException("Minute, phase and note are required.");
    }
    return this.prisma.opponentScoutingEvidence.create({
      data: {
        scoutingMatchId,
        minute: Number(body.minute),
        phase: body.phase,
        principle: body.principle || undefined,
        subPrinciple: body.subPrinciple || undefined,
        behaviour: body.behaviour || undefined,
        actor: body.actor || undefined,
        target: body.target || undefined,
        trigger: body.trigger || undefined,
        outcome: body.outcome || undefined,
        zone: body.zone || undefined,
        impact: body.impact == null ? undefined : Number(body.impact),
        note: body.note,
        videoRef: body.videoRef || undefined,
      },
    });
  }

  private outcomeClass(outcome?: string | null) {
    const value = outcome?.toLowerCase().trim();
    if (["progression", "chance created", "shot", "goal", "possession retained", "recovery"].includes(value || "")) return "SUCCESS";
    if (["possession lost", "opponent progression", "opponent chance"].includes(value || "")) return "FAILURE";
    return "NEUTRAL";
  }

  async getSummary(userId: string, matchId: string) {
    const context = await this.getContext(userId, matchId);
    const matches = await this.prisma.opponentScoutingMatch.findMany({
      where: { upcomingMatchId: matchId },
      orderBy: { matchDate: "desc" },
      include: { evidence: true },
    });

    const behaviourMap = new Map<string, { behaviour: string; principle: string | null; frequency: number; matches: Set<string>; success: number; failure: number; impact: number[] }>();
    const phaseMap = new Map<string, number>();
    const principleMap = new Map<string, number>();

    for (const match of matches) {
      for (const item of match.evidence) {
        const key = item.behaviour || item.principle || item.phase;
        const row = behaviourMap.get(key) || {
          behaviour: key,
          principle: item.principle,
          frequency: 0,
          matches: new Set<string>(),
          success: 0,
          failure: 0,
          impact: [],
        };
        row.frequency++;
        row.matches.add(match.id);
        row.impact.push(item.impact ?? 3);
        const result = this.outcomeClass(item.outcome);
        if (result === "SUCCESS") row.success++;
        if (result === "FAILURE") row.failure++;
        behaviourMap.set(key, row);

        phaseMap.set(item.phase, (phaseMap.get(item.phase) || 0) + 1);
        if (item.principle) principleMap.set(item.principle, (principleMap.get(item.principle) || 0) + 1);
      }
    }

    const recurringBehaviours = Array.from(behaviourMap.values())
      .map((row) => {
        const decisive = row.success + row.failure;
        return {
          behaviour: row.behaviour,
          principle: row.principle,
          frequency: row.frequency,
          matchCoverage: row.matches.size,
          coveragePct: matches.length ? Number(((row.matches.size / matches.length) * 100).toFixed(1)) : 0,
          successRate: decisive ? Number(((row.success / decisive) * 100).toFixed(1)) : null,
          averageImpact: Number((row.impact.reduce((a, b) => a + b, 0) / row.impact.length).toFixed(1)),
        };
      })
      .sort((a, b) => b.matchCoverage - a.matchCoverage || b.frequency - a.frequency);

    return {
      opponent: context.opponent,
      sample: {
        matchesAnalyzed: matches.length,
        recommendedSample: 5,
        sampleQuality: matches.length >= 5 ? "STRONG" : matches.length >= 3 ? "GOOD" : matches.length >= 1 ? "LIMITED" : "NO_DATA",
      },
      matchByMatch: matches.map((match) => ({
        id: match.id,
        sequence: match.sequence,
        opponent: match.opponentName,
        externalOpponent: match.externalOpponentName,
        date: match.matchDate,
        score: match.opponentScore != null && match.externalScore != null ? match.opponentScore + "-" + match.externalScore : null,
        evidenceCount: match.evidence.length,
        topBehaviours: Array.from(new Set(match.evidence.map((x) => x.behaviour || x.principle || x.phase))).slice(0, 5),
      })),
      recurringBehaviours,
      phases: Array.from(phaseMap.entries()).map(([phase, count]) => ({ phase, count })).sort((a, b) => b.count - a.count),
      principles: Array.from(principleMap.entries()).map(([principle, count]) => ({ principle, count })).sort((a, b) => b.count - a.count),
    };
  }
}
