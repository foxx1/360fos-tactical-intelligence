import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateGapDto } from "./dto/create-gap.dto";
import { UpdateGapDto } from "./dto/update-gap.dto";

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

  private async assertGapAccess(userId: string, matchId: string, gapId: string) {
    const gap = await this.prisma.tacticalGap.findFirst({
      where: {
        id: gapId,
        matchId,
        match: { team: { organization: { users: { some: { userId } } } } },
      },
      select: { id: true },
    });
    if (!gap) throw new NotFoundException("Tactical gap not found");
  }

  async createGap(userId: string, matchId: string, dto: CreateGapDto) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.tacticalGap.create({ data: { matchId, ...dto } });
  }

  async updateGap(userId: string, matchId: string, gapId: string, dto: UpdateGapDto) {
    await this.assertGapAccess(userId, matchId, gapId);
    return this.prisma.tacticalGap.update({ where: { id: gapId }, data: dto });
  }

  async findGaps(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.tacticalGap.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    });
  }

  private findingScore(item: any) {
    const success = item.successPct ?? 50;
    const impact = item.impact ?? 3;
    const frequency = item.frequency ?? 1;
    return Number((frequency * impact * (
      item.findingType === "STRENGTH" ? success / 100 : (100 - success) / 100
    )).toFixed(2));
  }

  async strengthsWeaknesses(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    const analyses = await this.prisma.analysis.findMany({
      where: { matchId, findingType: { not: null } },
      orderBy: { createdAt: "desc" },
    });

    const findings = analyses.map((item) => ({
      id: item.id,
      type: item.findingType,
      analysisType: item.type,
      phase: item.phase,
      principle: item.principle,
      subPrinciple: item.subPrinciple,
      behaviour: item.behaviour,
      outcome: item.outcome,
      frequency: item.frequency,
      successPct: item.successPct,
      impact: item.impact ?? 3,
      score: this.findingScore(item),
      priority: item.priority,
      videoRef: item.videoRef,
    }));

    return {
      strengths: findings.filter((item) => item.type === "STRENGTH").sort((a, b) => b.score - a.score),
      weaknesses: findings.filter((item) => item.type === "WEAKNESS").sort((a, b) => b.score - a.score),
    };
  }

  async summarize(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    const [analyses, evidence, gaps, priorities] = await Promise.all([
      this.prisma.analysis.count({ where: { matchId } }),
      this.prisma.evidence.count({ where: { matchId } }),
      this.prisma.tacticalGap.count({ where: { matchId } }),
      this.prisma.trainingPriority.count({ where: { matchId } }),
    ]);
    return {
      analysisItems: analyses,
      evidenceItems: evidence,
      tacticalGaps: gaps,
      trainingPriorities: priorities,
    };
  }

  async matrix(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    const [analyses, gaps] = await Promise.all([
      this.prisma.analysis.findMany({
        where: { matchId, findingType: { not: null } },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.tacticalGap.findMany({
        where: { matchId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const scored = analyses.map((item) => ({
      id: item.id,
      type: item.type,
      findingType: item.findingType,
      principle: item.principle,
      subPrinciple: item.subPrinciple,
      behaviour: item.behaviour,
      phase: item.phase,
      outcome: item.outcome,
      impact: item.impact ?? 3,
      frequency: item.frequency ?? 1,
      score: this.findingScore(item),
      priority: item.priority,
    }));

    const top = (type: "OUR_TEAM" | "OPPONENT", findingType: "STRENGTH" | "WEAKNESS") =>
      scored
        .filter((x) => x.type === type && x.findingType === findingType)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

    const ourStrengths = top("OUR_TEAM", "STRENGTH");
    const ourWeaknesses = top("OUR_TEAM", "WEAKNESS");
    const opponentStrengths = top("OPPONENT", "STRENGTH");
    const opponentWeaknesses = top("OPPONENT", "WEAKNESS");

    const gapFor = (type: "OPPORTUNITY" | "THREAT", a: any, b: any) =>
      gaps.find((gap) =>
        gap.type === type &&
        (type === "OPPORTUNITY"
          ? gap.ourStrength === a.behaviour && gap.opponentWeakness === b.behaviour
          : gap.ourWeakness === a.behaviour && gap.opponentStrength === b.behaviour)
      ) ?? null;

    const opportunities = ourStrengths.flatMap((strength) =>
      opponentWeaknesses.map((weakness) => ({
        type: "OPPORTUNITY" as const,
        ourStrength: strength,
        opponentWeakness: weakness,
        interaction: "Use " + strength.behaviour + " against opponent " + weakness.behaviour,
        gap: gapFor("OPPORTUNITY", strength, weakness),
      }))
    );

    const threats = ourWeaknesses.flatMap((weakness) =>
      opponentStrengths.map((strength) => ({
        type: "THREAT" as const,
        ourWeakness: weakness,
        opponentStrength: strength,
        interaction: "Protect against opponent " + strength.behaviour + " with our " + weakness.behaviour,
        gap: gapFor("THREAT", weakness, strength),
      }))
    );

    return {
      ourStrengths,
      ourWeaknesses,
      opponentStrengths,
      opponentWeaknesses,
      opportunities,
      threats,
      quadrants: {
        strengthVsStrength: ourStrengths.flatMap((ours) =>
          opponentStrengths.map((opponent) => ({
            ourFinding: ours,
            opponentFinding: opponent,
            interaction: "Control the opponent strength: " + opponent.behaviour,
          }))
        ),
        weaknessVsWeakness: ourWeaknesses.flatMap((ours) =>
          opponentWeaknesses.map((opponent) => ({
            ourFinding: ours,
            opponentFinding: opponent,
            interaction: "Potentially exploitable: " + opponent.behaviour,
          }))
        ),
      },
      gaps,
    };
  }

  private classifyOutcome(outcome?: string | null) {
    const value = outcome?.trim().toLowerCase();
    if (!value) return "NEUTRAL";

    const success = new Set([
      "progression",
      "chance created",
      "shot",
      "goal",
      "possession retained",
      "recovery",
    ]);
    const failure = new Set([
      "possession lost",
      "opponent progression",
      "opponent chance",
    ]);

    if (success.has(value)) return "SUCCESS";
    if (failure.has(value)) return "FAILURE";
    return "NEUTRAL";
  }

  private classifyFromText(event: string, note: string) {
    const text = (event + " " + note).toLowerCase();
    const negative = /error|failed|failure|loss|lost|slow|late|poor|missed|conceded|wrong|bad|turnover|mistake|space conceded|out of position/i;
    const positive = /successful|success|effective|won|created|progress|penetrat|recover|press|counter.?press|overload|chance|shot|goal|excellent|quick/i;
    const negativeHits = (text.match(negative) ?? []).length;
    const positiveHits = (text.match(positive) ?? []).length;

    if (negativeHits > positiveHits) return "FAILURE";
    if (positiveHits > negativeHits) return "SUCCESS";
    return "NEUTRAL";
  }

  private priorityFor(score: number) {
    return score >= 12 ? "CRITICAL" : score >= 7 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";
  }

  async generateFromEvidence(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);

    const evidence = await this.prisma.evidence.findMany({
      where: { matchId },
      orderBy: { minute: "asc" },
    });

    if (!evidence.length) {
      return {
        generatedAnalyses: 0,
        generatedGaps: 0,
        generatedPriorities: 0,
        message: "Add evidence before generating intelligence.",
      };
    }

    /*
     * Intelligence v2:
     * Phase → Principle → Sub-Principle → Behaviour → Outcome → Impact
     *
     * Structured evidence is the primary signal. Text heuristics remain
     * only as a fallback for legacy evidence without an outcome.
     */
    const groups = new Map<string, typeof evidence>();

    for (const item of evidence) {
      const key = [
        item.analysisType,
        item.phase,
        item.principle?.trim() || "UNCLASSIFIED",
        item.subPrinciple?.trim() || "UNCLASSIFIED",
        item.behaviour?.trim() || item.event.trim(),
        item.zone?.trim() || "GENERAL",
      ].join("|");

      const group = groups.get(key) ?? [];
      group.push(item);
      groups.set(key, group);
    }

    let generatedAnalyses = 0;

    for (const [key, group] of groups) {
      const marker = "evidence-engine-v2:" + Buffer.from(key).toString("base64url");
      const exists = await this.prisma.analysis.findFirst({
        where: { matchId, videoRef: marker },
      });
      if (exists) continue;

      let successes = 0;
      let failures = 0;
      let neutrals = 0;

      for (const item of group) {
        const classification = item.outcome
          ? this.classifyOutcome(item.outcome)
          : this.classifyFromText(item.event, item.note);

        if (classification === "SUCCESS") successes++;
        else if (classification === "FAILURE") failures++;
        else neutrals++;
      }

      const decisive = successes + failures;
      const successPct = decisive > 0
        ? Number(((successes / decisive) * 100).toFixed(1))
        : 50;

      const findingType = successPct >= 60
        ? "STRENGTH"
        : successPct <= 40
          ? "WEAKNESS"
          : "STRENGTH";

      const impact = Math.max(
        1,
        Math.min(
          5,
          Math.round(group.reduce((sum, item) => sum + (item.impact ?? 3), 0) / group.length),
        ),
      );

      const frequency = group.length;
      const score = Number((
        frequency *
        impact *
        (findingType === "STRENGTH" ? successPct / 100 : (100 - successPct) / 100)
      ).toFixed(2));

      const priority = this.priorityFor(score);

      await this.prisma.analysis.create({
        data: {
          matchId,
          type: group[0].analysisType,
          phase: group[0].phase,
          subPhase: group[0].zone ?? "General",
          principle: group[0].principle,
          subPrinciple: group[0].subPrinciple,
          behaviour: group[0].behaviour ?? group[0].event,
          actor: group[0].actor,
          target: group[0].target,
          trigger: group[0].trigger,
          outcome: group[0].outcome ?? "No Outcome",
          zone: group[0].zone,
          evidence: group
            .map((item) => "@" + item.minute + " " + item.note)
            .join(" | "),
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

    const analyses = await this.prisma.analysis.findMany({
      where: { matchId, findingType: { not: null } },
    });

    const weight = (item: any) => (item.impact ?? 0) * (item.frequency ?? 1);

    const ourStrengths = analyses
      .filter((item) => item.type === "OUR_TEAM" && item.findingType === "STRENGTH")
      .sort((a, b) => weight(b) - weight(a))
      .slice(0, 3);

    const ourWeaknesses = analyses
      .filter((item) => item.type === "OUR_TEAM" && item.findingType === "WEAKNESS")
      .sort((a, b) => weight(b) - weight(a))
      .slice(0, 3);

    const oppStrengths = analyses
      .filter((item) => item.type === "OPPONENT" && item.findingType === "STRENGTH")
      .sort((a, b) => weight(b) - weight(a))
      .slice(0, 3);

    const oppWeaknesses = analyses
      .filter((item) => item.type === "OPPONENT" && item.findingType === "WEAKNESS")
      .sort((a, b) => weight(b) - weight(a))
      .slice(0, 3);

    let generatedGaps = 0;

    const gapPairs = [
      ...ourStrengths.flatMap((strength) =>
        oppWeaknesses.slice(0, 1).map((weakness) => ({
          type: "OPPORTUNITY" as const,
          strength,
          weakness,
          title: "Use " + strength.behaviour + " against opponent " + weakness.behaviour,
        })),
      ),
      ...ourWeaknesses.flatMap((weakness) =>
        oppStrengths.slice(0, 1).map((strength) => ({
          type: "THREAT" as const,
          strength,
          weakness,
          title: "Protect against opponent " + strength.behaviour + " with our " + weakness.behaviour,
        })),
      ),
    ].slice(0, 6);

    for (const pair of gapPairs) {
      const exists = await this.prisma.tacticalGap.findFirst({
        where: { matchId, interaction: pair.title },
      });
      if (exists) continue;

      await this.prisma.tacticalGap.create({
        data: {
          matchId,
          type: pair.type,
          ourStrength: pair.type === "OPPORTUNITY" ? pair.strength.behaviour : undefined,
          ourWeakness: pair.type === "THREAT" ? pair.weakness.behaviour : undefined,
          opponentWeakness: pair.type === "OPPORTUNITY" ? pair.weakness.behaviour : undefined,
          opponentStrength: pair.type === "THREAT" ? pair.strength.behaviour : undefined,
          interaction: pair.title,
          opportunity: pair.type === "OPPORTUNITY" ? pair.title : undefined,
          threat: pair.type === "THREAT" ? pair.title : undefined,
          tacticalPrinciple: pair.type === "OPPORTUNITY"
            ? pair.strength.principle ?? "Exploit the identified opponent weakness."
            : pair.weakness.principle ?? "Protect the vulnerable area and control the opponent strength.",
          playerBehaviour: pair.type === "OPPORTUNITY"
            ? pair.strength.behaviour
            : pair.weakness.behaviour,
          teamBehaviour: pair.type === "OPPORTUNITY"
            ? pair.strength.behaviour
            : pair.weakness.behaviour,
          trainingObjective: pair.type === "OPPORTUNITY"
            ? "Train " + pair.strength.behaviour + " to repeatedly attack " + pair.weakness.behaviour + "."
            : "Train the team to resist " + pair.strength.behaviour + " and improve " + pair.weakness.behaviour + ".",
          matchObjective: pair.type === "OPPORTUNITY"
            ? "Transfer " + pair.strength.behaviour + " into repeated exploitation of the opponent weakness."
            : "Control " + pair.strength.behaviour + " while improving " + pair.weakness.behaviour + ".",
          priority: "HIGH",
          status: "OPEN",
        },
      });
      generatedGaps++;
    }

    let generatedPriorities = 0;

    for (const weakness of ourWeaknesses.slice(0, 3)) {
      const marker = "evidence-training-v2:" + weakness.id;
      const exists = await this.prisma.trainingPriority.findFirst({
        where: { matchId, evidence: { contains: marker } },
      });
      if (exists) continue;

      await this.prisma.trainingPriority.create({
        data: {
          matchId,
          rank: generatedPriorities + 1,
          priority: weakness.priority ?? "MEDIUM",
          problem: weakness.behaviour,
          evidence: marker + " | " + (weakness.evidence ?? ""),
          diagnosis:
            "Repeated " +
            weakness.behaviour +
            " issue identified from " +
            weakness.frequency +
            " structured evidence item(s), with " +
            (weakness.successPct ?? 0) +
            "% decisive success rate.",
          objective: "Improve " + weakness.behaviour + " under realistic match pressure.",
          exerciseType: "Game-based tactical exercise",
          constraint: "Recreate the match context and require the target behaviour within 5 seconds.",
          players: "Relevant unit + opposition",
          durationMinutes: 12,
          intensity: "High",
          successKpi: "Target behaviour achieved consistently in representative repetitions.",
          matchObjective: "Transfer improved " + weakness.behaviour + " into the match model.",
        },
      });
      generatedPriorities++;
    }

    return {
      generatedAnalyses,
      generatedGaps,
      generatedPriorities,
      message: "Structured tactical evidence processed into Intelligence Engine v2.",
    };
  }
}
