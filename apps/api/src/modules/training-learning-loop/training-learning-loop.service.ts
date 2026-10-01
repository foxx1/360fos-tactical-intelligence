import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

type TransferStatus = "TRANSFERRED" | "PARTIAL" | "NOT_TRANSFERRED" | "INSUFFICIENT_EVIDENCE";

@Injectable()
export class TrainingLearningLoopService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        id: matchId,
        team: { organization: { users: { some: { userId } } } },
      },
      select: {
        id: true,
        teamId: true,
        matchDate: true,
        status: true,
        opponent: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });
    if (!match) throw new NotFoundException("Match not found");
    return match;
  }

  private normalize(value?: string | null) {
    return (value ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private similarity(a?: string | null, b?: string | null) {
    const left = this.normalize(a);
    const right = this.normalize(b);
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right) || right.includes(left)) return 0.9;
    const aTokens = new Set(left.split(" "));
    const bTokens = new Set(right.split(" "));
    const intersection = [...aTokens].filter((token) => bTokens.has(token)).length;
    const union = new Set([...aTokens, ...bTokens]).size;
    return union ? intersection / union : 0;
  }

  private classifyEvidence(outcome?: string | null, note?: string | null) {
    const value = this.normalize(outcome);
    if (["progression", "chance created", "shot", "goal", "possession retained", "recovery"].includes(value)) return "SUCCESS";
    if (["possession lost", "opponent progression", "opponent chance"].includes(value)) return "FAILURE";
    const text = this.normalize((outcome ?? "") + " " + (note ?? ""));
    if (/successful|success|effective|progress|recover|press|counter press|chance|shot|goal|quick/.test(text)) return "SUCCESS";
    if (/error|failed|failure|lost|slow|late|poor|missed|conceded|wrong|turnover|mistake|out of position/.test(text)) return "FAILURE";
    return "NEUTRAL";
  }

  private transferFor(behaviour: any, evidence: any[]) {
    const relevant = evidence
      .map((item) => ({ ...item, similarity: Math.max(
        this.similarity(behaviour.behaviour, item.behaviour),
        this.similarity(behaviour.behaviour, item.event),
        this.similarity(behaviour.behaviour, item.note),
      ) }))
      .filter((item) => item.similarity >= 0.45);

    const outcomes = relevant.map((item) => this.classifyEvidence(item.outcome, item.note));
    const successes = outcomes.filter((x) => x === "SUCCESS").length;
    const failures = outcomes.filter((x) => x === "FAILURE").length;
    const decisive = successes + failures;
    const successRate = decisive ? Math.round((successes / decisive) * 100) : null;
    let status: TransferStatus = "INSUFFICIENT_EVIDENCE";
    if (relevant.length >= 3 && successRate !== null) {
      status = successRate >= 70 ? "TRANSFERRED" : successRate >= 50 ? "PARTIAL" : "NOT_TRANSFERRED";
    } else if (relevant.length >= 1 && successRate !== null) {
      status = successRate >= 70 ? "PARTIAL" : "INSUFFICIENT_EVIDENCE";
    }

    return {
      behaviour: behaviour.behaviour,
      targetKpi: behaviour.targetKpi,
      trainingSuccessRate: behaviour.successRate,
      coachRating: behaviour.coachRating,
      matchEvidenceCount: relevant.length,
      matchSuccessRate: successRate,
      status,
      confidence: Math.min(100, relevant.length * 20 + (decisive ? 30 : 0)),
      evidence: relevant.slice(0, 5).map((item) => ({
        id: item.id,
        minute: item.minute,
        phase: item.phase,
        principle: item.principle,
        subPrinciple: item.subPrinciple,
        behaviour: item.behaviour,
        event: item.event,
        outcome: item.outcome,
        note: item.note,
        videoRef: item.videoRef,
        similarity: Number(item.similarity.toFixed(2)),
      })),
    };
  }

  async getLoop(userId: string, matchId: string) {
    const match = await this.getMatch(userId, matchId);
    const [sessions, evidence] = await Promise.all([
      this.prisma.trainingSession.findMany({
        where: { matchId },
        orderBy: [{ sessionDate: "asc" }, { createdAt: "asc" }],
        include: {
          assessment: true,
          behaviourResults: { orderBy: { createdAt: "asc" } },
          learningActions: { orderBy: { createdAt: "desc" } },
          exercises: { orderBy: { exerciseOrder: "asc" }, select: { id: true, title: true, matchBehaviour: true } },
        },
      }),
      this.prisma.evidence.findMany({
        where: { matchId, analysisType: "OUR_TEAM" },
        orderBy: { minute: "asc" },
      }),
    ]);

    const behaviours = sessions.flatMap((session) =>
      session.behaviourResults.map((result) => ({
        ...this.transferFor(result, evidence),
        sessionId: session.id,
        sessionTitle: session.title,
        sessionDate: session.sessionDate,
      })),
    );

    const exerciseTargets = sessions.flatMap((session) =>
      session.exercises
        .filter((exercise) => exercise.matchBehaviour)
        .map((exercise) => ({
          behaviour: exercise.matchBehaviour,
          sessionId: session.id,
          sessionTitle: session.title,
        })),
    );

    const targetOnly = exerciseTargets
      .filter((target, index, all) => all.findIndex((x) => this.normalize(x.behaviour) === this.normalize(target.behaviour)) === index)
      .map((target) => {
        const pseudo = { behaviour: target.behaviour, targetKpi: null, successRate: null, coachRating: null };
        return { ...this.transferFor(pseudo, evidence), sessionId: target.sessionId, sessionTitle: target.sessionTitle };
      });

    const results = [...behaviours, ...targetOnly];
    const transferred = results.filter((x) => x.status === "TRANSFERRED").length;
    const partial = results.filter((x) => x.status === "PARTIAL").length;
    const notTransferred = results.filter((x) => x.status === "NOT_TRANSFERRED").length;
    const sufficient = results.filter((x) => x.status !== "INSUFFICIENT_EVIDENCE").length;
    const transferRate = sufficient ? Math.round((transferred / sufficient) * 100) : null;

    const nextActions = results.map((result) => {
      if (result.status === "TRANSFERRED") return { behaviour: result.behaviour, action: "Progress the behaviour and test it against stronger opposition cues." };
      if (result.status === "PARTIAL") return { behaviour: result.behaviour, action: "Reinforce the behaviour with more representative repetitions and tighter constraints." };
      if (result.status === "NOT_TRANSFERRED") return { behaviour: result.behaviour, action: "Re-teach the behaviour and return to a simpler representative exercise before the next match." };
      return { behaviour: result.behaviour, action: "Collect more structured match evidence before changing the training prescription." };
    });

    return {
      modelVersion: "TRAINING_MATCH_LEARNING_LOOP_V1",
      match: {
        id: match.id,
        team: match.team,
        opponent: match.opponent,
        matchDate: match.matchDate,
        status: match.status,
      },
      training: {
        sessions: sessions.map((session) => ({
          id: session.id,
          title: session.title,
          sessionDate: session.sessionDate,
          status: session.status,
          assessment: session.assessment,
          behaviourCount: session.behaviourResults.length,
          learningActions: session.learningActions,
        })),
        sessionCount: sessions.length,
      },
      matchValidation: {
        evidenceCount: evidence.length,
        structuredEvidenceCount: evidence.filter((x) => x.behaviour || x.principle || x.subPrinciple).length,
        results,
        summary: {
          behavioursTracked: results.length,
          transferred,
          partial,
          notTransferred,
          insufficientEvidence: results.length - sufficient,
          transferRate,
        },
      },
      nextActions,
      governance: [
        "Training evidence is the intended behaviour signal; match evidence validates transfer.",
        "No transfer claim is made when the match contains insufficient relevant evidence.",
        "Transfer status is rule-based in v1 and should remain traceable to training and match evidence.",
      ],
    };
  }
}
