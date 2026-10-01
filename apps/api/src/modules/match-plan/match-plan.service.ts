import { Injectable } from "@nestjs/common";
import { IntelligenceService } from "../intelligence/intelligence.service";
import { OpponentScoutingService } from "../opponent-scouting/opponent-scouting.service";

type Finding = {
  behaviour: string;
  principle?: string | null;
  subPrinciple?: string | null;
  phase?: string | null;
  score?: number;
  strengthScore?: number;
  weaknessScore?: number;
  priority?: string | null;
  successPct?: number | null;
  successRate?: number | null;
  failureRate?: number | null;
  impact?: number;
  frequency?: number;
  coveragePct?: number;
  confidence?: number;
};

@Injectable()
export class MatchPlanService {
  constructor(
    private readonly intelligence: IntelligenceService,
    private readonly opponentScouting: OpponentScoutingService,
  ) {}

  private score(value: Finding) {
    return Number(value.score ?? value.strengthScore ?? value.weaknessScore ?? 0);
  }

  private text(value?: string | null) {
    return (value || "the identified behaviour").trim();
  }

  private priority(score: number) {
    if (score >= 14) return "CRITICAL";
    if (score >= 9) return "HIGH";
    if (score >= 5) return "MEDIUM";
    return "LOW";
  }

  async build(userId: string, matchId: string) {
    const [matrix, opponent] = await Promise.all([
      this.intelligence.matrix(userId, matchId),
      this.opponentScouting.getIntelligence(userId, matchId),
    ]);

    const ourStrengths = (matrix.ourStrengths || []) as Finding[];
    const ourWeaknesses = (matrix.ourWeaknesses || []) as Finding[];
    const opponentStrengths = (opponent.strengths || []) as Finding[];
    const opponentWeaknesses = (opponent.weaknesses || []) as Finding[];

    const opportunities = ourStrengths.flatMap((our) =>
      opponentWeaknesses.map((opp) => {
        const score = this.score(our) + this.score(opp);
        return {
          type: "OPPORTUNITY",
          priority: this.priority(score),
          score: Number(score.toFixed(2)),
          phase: opp.phase || our.phase || null,
          title: "Exploit " + this.text(opp.behaviour),
          why: "Our " + this.text(our.behaviour) + " is a documented strength that can be used against the opponent's " + this.text(opp.behaviour) + ".",
          action: "Create repeated situations where " + this.text(our.behaviour) + " attacks " + this.text(opp.behaviour) + ".",
          ourBehaviour: our.behaviour,
          opponentBehaviour: opp.behaviour,
          evidence: {
            our: { score: this.score(our), phase: our.phase, frequency: our.frequency, successPct: our.successPct },
            opponent: { score: this.score(opp), phase: opp.phase, coveragePct: opp.coveragePct, confidence: opp.confidence, failureRate: opp.failureRate },
          },
        };
      }),
    ).sort((a, b) => b.score - a.score).slice(0, 8);

    const threats = ourWeaknesses.flatMap((our) =>
      opponentStrengths.map((opp) => {
        const score = this.score(our) + this.score(opp);
        return {
          type: "THREAT",
          priority: this.priority(score),
          score: Number(score.toFixed(2)),
          phase: opp.phase || our.phase || null,
          title: "Control " + this.text(opp.behaviour),
          why: "Our " + this.text(our.behaviour) + " is a documented weakness while the opponent repeatedly shows " + this.text(opp.behaviour) + ".",
          action: "Protect the exposed area, reduce access to " + this.text(opp.behaviour) + ", and reinforce " + this.text(our.behaviour) + ".",
          ourBehaviour: our.behaviour,
          opponentBehaviour: opp.behaviour,
          evidence: {
            our: { score: this.score(our), phase: our.phase, frequency: our.frequency, successPct: our.successPct },
            opponent: { score: this.score(opp), phase: opp.phase, coveragePct: opp.coveragePct, confidence: opp.confidence, successRate: opp.successRate },
          },
        };
      }),
    ).sort((a, b) => b.score - a.score).slice(0, 8);

    const pressingTargets = opponentWeaknesses
      .filter((x) => ["OUT_OF_POSSESSION", "DEFENSIVE_TRANSITION", "ATTACKING_TRANSITION"].includes(x.phase || ""))
      .sort((a, b) => this.score(b) - this.score(a))
      .slice(0, 4)
      .map((x) => ({
        target: x.behaviour,
        phase: x.phase,
        reason: "Recurring opponent weakness identified across the scouting sample.",
        coachingAction: "Use the relevant press trigger to force the opponent into this weakness.",
        confidence: x.confidence ?? null,
      }));

    const buildUpTargets = opportunities
      .filter((x) => ["IN_POSSESSION", "ATTACKING_TRANSITION"].includes(x.phase || ""))
      .slice(0, 4)
      .map((x) => ({
        target: x.opponentBehaviour,
        ourBehaviour: x.ourBehaviour,
        reason: x.why,
        coachingAction: x.action,
      }));

    const defensivePriorities = threats.slice(0, 4).map((x) => ({
      priority: x.priority,
      threat: x.opponentBehaviour,
      ourWeakness: x.ourBehaviour,
      phase: x.phase,
      action: x.action,
    }));

    const matchPriorities = [...opportunities, ...threats]
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((x, index) => ({
        rank: index + 1,
        category: x.type,
        priority: x.priority,
        score: x.score,
        title: x.title,
        why: x.why,
        action: x.action,
        phase: x.phase,
      }));

    const keyBattles = [...opportunities.slice(0, 3), ...threats.slice(0, 3)]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => ({
        battle: x.title,
        type: x.type,
        phase: x.phase,
        ourBehaviour: x.ourBehaviour,
        opponentBehaviour: x.opponentBehaviour,
        decisiveAction: x.action,
      }));

    const sampleMatches = opponent.sample.matchesAnalyzed;
    const status =
      sampleMatches >= 5 && (ourStrengths.length + ourWeaknesses.length) > 0 ? "READY" :
      sampleMatches >= 3 && (ourStrengths.length + ourWeaknesses.length) > 0 ? "WORKABLE" :
      "LIMITED";

    return {
      modelVersion: "MATCH_PLAN_V1",
      status,
      inputs: {
        ourTeam: { strengths: ourStrengths.length, weaknesses: ourWeaknesses.length },
        opponent: {
          matchesAnalyzed: sampleMatches,
          evidence: opponent.sample.evidenceCount,
          quality: opponent.sample.quality,
          confidence: opponent.sample.confidence,
          strengths: opponentStrengths.length,
          weaknesses: opponentWeaknesses.length,
        },
      },
      matchPriorities,
      opportunities,
      threats,
      keyBattles,
      pressingTargets,
      buildUpTargets,
      defensivePriorities,
      principles: {
        withBall: buildUpTargets.length
          ? "Use identified strengths to repeatedly access the opponent weaknesses."
          : "Establish clear progression and chance-creation behaviours from the available evidence.",
        withoutBall: pressingTargets.length
          ? "Press through defined triggers toward the opponent weaknesses."
          : "Protect the identified threats and maintain compactness around the main opponent strengths.",
        transition: "Secure the first action after regain or loss and connect it to the selected match priority.",
      },
      decisionRules: [
        "Priorities are generated from documented evidence.",
        "Opportunities combine an Our Team strength with an Opponent weakness.",
        "Threats combine an Our Team weakness with an Opponent strength.",
        "Opponent conclusions are confidence-limited by the scouting sample.",
      ],
    };
  }
}
