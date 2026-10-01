import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class OpponentScoutingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getContext(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true, teamId: true, opponentId: true, team: { select: { id: true, name: true, category: true, gender: true } }, opponent: { select: { id: true, name: true, teamId: true, team: { select: { id: true, name: true, category: true, gender: true } } } } },
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
      include: { opponent: true, externalOpponentTeam: true, evidence: { orderBy: { minute: "asc" } } },
    });
    if (!row) throw new NotFoundException("Opponent scouting match not found");
    return row;
  }

  async getWorkspace(userId: string, matchId: string) {
    const context = await this.getContext(userId, matchId);
    const matches = await this.prisma.opponentScoutingMatch.findMany({
      where: { upcomingMatchId: matchId },
      orderBy: { sequence: "asc" },
      include: { externalOpponentTeam: true, _count: { select: { evidence: true } } },
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
    if ((!body.externalOpponentName && !body.externalOpponentTeamId) || Number.isNaN(matchDate.getTime())) {
      throw new BadRequestException("External opponent name and match date are required.");
    }

    let externalOpponentName = body.externalOpponentName?.trim() || "";
    let externalOpponentTeamId: string | undefined;
    if (body.externalOpponentTeamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: body.externalOpponentTeamId, organization: { users: { some: { userId } } } },
      });
      if (!team) throw new BadRequestException("External opponent team not found in the team registry.");
      externalOpponentTeamId = team.id;
      externalOpponentName = team.name;
    }

    return this.prisma.opponentScoutingMatch.create({
      data: {
        upcomingMatchId: matchId,
        opponentId: context.opponentId,
        opponentName: context.opponent.name,
        externalOpponentName,
        externalOpponentTeamId,
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

  async getIntelligence(userId: string, matchId: string) {
    const context = await this.getContext(userId, matchId);
    const matches = await this.prisma.opponentScoutingMatch.findMany({
      where: { upcomingMatchId: matchId },
      orderBy: { matchDate: "desc" },
      include: { externalOpponentTeam: true, evidence: { orderBy: { minute: "asc" } } },
    });

    const totalMatches = matches.length;
    const evidenceRows = matches.flatMap((match) => match.evidence.map((e) => ({ ...e, matchId: match.id, matchSequence: match.sequence })));

    type Pattern = {
      key: string;
      behaviour: string;
      principle: string | null;
      subPrinciple: string | null;
      phase: string;
      frequency: number;
      matchIds: Set<string>;
      success: number;
      failure: number;
      neutral: number;
      impacts: number[];
      examples: { scoutingMatchId: string; sequence: number; minute: number; note: string; videoRef: string | null }[];
    };

    const patterns = new Map<string, Pattern>();
    const phaseMap = new Map<string, { evidence: number; matches: Set<string>; impact: number[] }>();
    const principleMap = new Map<string, { evidence: number; matches: Set<string>; success: number; failure: number; impact: number[] }>();
    const outcomeMap = new Map<string, number>();

    for (const item of evidenceRows) {
      const behaviour = item.behaviour || item.subPrinciple || item.principle || item.phase;
      const key = [item.phase, item.principle || "", item.subPrinciple || "", behaviour].join("|");
      const row = patterns.get(key) || {
        key, behaviour, principle: item.principle, subPrinciple: item.subPrinciple,
        phase: item.phase, frequency: 0, matchIds: new Set<string>(), success: 0, failure: 0, neutral: 0, impacts: [], examples: [],
      };
      row.frequency++;
      row.matchIds.add(item.matchId);
      row.impacts.push(item.impact ?? 3);
      const outcome = this.outcomeClass(item.outcome);
      if (outcome === "SUCCESS") row.success++;
      else if (outcome === "FAILURE") row.failure++;
      else row.neutral++;
      if (row.examples.length < 3) row.examples.push({
        scoutingMatchId: item.matchId, sequence: item.matchSequence, minute: item.minute, note: item.note, videoRef: item.videoRef,
      });
      patterns.set(key, row);

      const phase = phaseMap.get(item.phase) || { evidence: 0, matches: new Set<string>(), impact: [] };
      phase.evidence++; phase.matches.add(item.matchId); phase.impact.push(item.impact ?? 3); phaseMap.set(item.phase, phase);

      if (item.principle) {
        const principle = principleMap.get(item.principle) || { evidence: 0, matches: new Set<string>(), success: 0, failure: 0, impact: [] };
        principle.evidence++; principle.matches.add(item.matchId); principle.impact.push(item.impact ?? 3);
        if (outcome === "SUCCESS") principle.success++;
        if (outcome === "FAILURE") principle.failure++;
        principleMap.set(item.principle, principle);
      }

      const outcomeKey = outcome;
      outcomeMap.set(outcomeKey, (outcomeMap.get(outcomeKey) || 0) + 1);
    }

    const buildPattern = (row: Pattern) => {
      const decisive = row.success + row.failure;
      const coverage = totalMatches ? row.matchIds.size / totalMatches : 0;
      const outcomeQuality = decisive ? Math.min(1, decisive / row.frequency) : 0.35;
      const consistency = Math.min(1, row.frequency / Math.max(2, totalMatches * 2));
      const confidence = Math.round(100 * (0.5 * coverage + 0.3 * consistency + 0.2 * outcomeQuality));
      const successRate = decisive ? Number(((row.success / decisive) * 100).toFixed(1)) : null;
      const avgImpact = Number((row.impacts.reduce((a, b) => a + b, 0) / row.impacts.length).toFixed(1));
      const strengthScore = Number((row.frequency * avgImpact * (successRate == null ? 0.5 : successRate / 100) * coverage).toFixed(2));
      const weaknessScore = Number((row.frequency * avgImpact * (successRate == null ? 0.5 : (100 - successRate) / 100) * coverage).toFixed(2));
      return {
        behaviour: row.behaviour, principle: row.principle, subPrinciple: row.subPrinciple, phase: row.phase,
        evidenceCount: row.frequency, matchCoverage: row.matchIds.size, coveragePct: Number((coverage * 100).toFixed(1)),
        successRate, failureRate: decisive ? Number(((row.failure / decisive) * 100).toFixed(1)) : null,
        averageImpact: avgImpact, confidence, strengthScore, weaknessScore, examples: row.examples,
      };
    };

    const allPatterns = Array.from(patterns.values()).map(buildPattern);
    const strengths = allPatterns
      .filter((x) => x.evidenceCount >= 2 && (x.successRate == null ? x.averageImpact >= 4 : x.successRate >= 60))
      .sort((a, b) => b.strengthScore - a.strengthScore)
      .slice(0, 10);
    const weaknesses = allPatterns
      .filter((x) => x.evidenceCount >= 2 && x.failureRate != null && x.failureRate >= 40)
      .sort((a, b) => b.weaknessScore - a.weaknessScore)
      .slice(0, 10);

    const tendencies = allPatterns
      .filter((x) => x.evidenceCount >= 2 && x.coveragePct >= 40)
      .sort((a, b) => b.coveragePct - a.coveragePct || b.evidenceCount - a.evidenceCount)
      .slice(0, 15)
      .map((x) => ({ ...x, tendency: x.coveragePct >= 80 ? "CONSISTENT" : x.coveragePct >= 60 ? "RECURRENT" : "EMERGING" }));

    const phases = Array.from(phaseMap.entries()).map(([phase, row]) => ({
      phase, evidenceCount: row.evidence, matchCoverage: row.matches.size,
      coveragePct: totalMatches ? Number(((row.matches.size / totalMatches) * 100).toFixed(1)) : 0,
      averageImpact: Number((row.impact.reduce((a, b) => a + b, 0) / row.impact.length).toFixed(1)),
    })).sort((a, b) => b.evidenceCount - a.evidenceCount);

    const principles = Array.from(principleMap.entries()).map(([principle, row]) => {
      const decisive = row.success + row.failure;
      return {
        principle, evidenceCount: row.evidence, matchCoverage: row.matches.size,
        coveragePct: totalMatches ? Number(((row.matches.size / totalMatches) * 100).toFixed(1)) : 0,
        successRate: decisive ? Number(((row.success / decisive) * 100).toFixed(1)) : null,
        averageImpact: Number((row.impact.reduce((a, b) => a + b, 0) / row.impact.length).toFixed(1)),
      };
    }).sort((a, b) => b.evidenceCount - a.evidenceCount);

    const quality = totalMatches >= 5 ? "STRONG" : totalMatches >= 3 ? "GOOD" : totalMatches >= 1 ? "LIMITED" : "NO_DATA";
    const confidence = totalMatches === 0 ? 0 : Math.round(
      Math.min(100, (totalMatches / 5) * 60 + Math.min(40, evidenceRows.length * 2))
    );

    return {
      modelVersion: "OPPONENT_INTELLIGENCE_V1",
      opponent: context.opponent,
      sample: { matchesAnalyzed: totalMatches, evidenceCount: evidenceRows.length, recommendedMatches: 5, quality, confidence },
      executiveProfile: {
        identity: context.opponent?.team || { id: context.opponent?.teamId || null, name: context.opponent?.name || "Opponent" },
        dominantPhases: phases.slice(0, 3),
        recurringTendencies: tendencies.slice(0, 8),
        strengths: strengths.slice(0, 6),
        weaknesses: weaknesses.slice(0, 6),
      },
      strengths,
      weaknesses,
      tendencies,
      phases,
      principles,
      outcomeDistribution: Array.from(outcomeMap.entries()).map(([outcome, count]) => ({ outcome, count })),
      matchByMatch: matches.map((match) => ({
        id: match.id, sequence: match.sequence, date: match.matchDate,
        opponent: match.opponentName, externalOpponent: match.externalOpponentName,
        score: match.opponentScore != null && match.externalScore != null ? match.opponentScore + "-" + match.externalScore : null,
        evidenceCount: match.evidence.length,
        topPatterns: Array.from(new Set(match.evidence.map((x) => x.behaviour || x.subPrinciple || x.principle || x.phase))).slice(0, 5),
      })),
    };
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
