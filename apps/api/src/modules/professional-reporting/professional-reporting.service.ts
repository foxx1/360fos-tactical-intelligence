import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class ProfessionalReportingService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      include: {
        team: { select: { id: true, name: true, shortName: true, clubName: true, category: true, gender: true } },
        opponent: { select: { id: true, name: true, team: true } },
        competition: { select: { id: true, name: true } },
        season: { select: { id: true, name: true } },
      },
    });
    if (!match) throw new NotFoundException("Match not found");
    return match;
  }

  private score(item: any) {
    const frequency = item.frequency ?? 1;
    const impact = item.impact ?? 3;
    const success = item.successPct ?? 50;
    return Number((frequency * impact * (item.findingType === "STRENGTH" ? success / 100 : (100 - success) / 100)).toFixed(2));
  }

  async getReport(userId: string, matchId: string) {
    const match = await this.getMatch(userId, matchId);

    const [analyses, evidence, gaps, priorities, sessions, scoutingMatches] = await Promise.all([
      this.prisma.analysis.findMany({ where: { matchId }, orderBy: { createdAt: "desc" } }),
      this.prisma.evidence.findMany({ where: { matchId }, orderBy: { minute: "asc" } }),
      this.prisma.tacticalGap.findMany({ where: { matchId }, orderBy: [{ priority: "asc" }, { createdAt: "desc" }] }),
      this.prisma.trainingPriority.findMany({ where: { matchId }, orderBy: [{ rank: "asc" }, { createdAt: "asc" }] }),
      this.prisma.trainingSession.findMany({
        where: { matchId },
        orderBy: [{ sessionDate: "asc" }, { createdAt: "asc" }],
        include: { assessment: true, behaviourResults: true, exercises: true, learningActions: true },
      }),
      this.prisma.opponentScoutingMatch.findMany({
        where: { upcomingMatchId: matchId },
        orderBy: { sequence: "asc" },
        include: { evidence: true, externalOpponentTeam: true },
      }),
    ]);

    const ourStrengths = analyses.filter(x => x.type === "OUR_TEAM" && x.findingType === "STRENGTH")
      .map(x => ({ ...x, score: this.score(x) })).sort((a,b) => b.score-a.score).slice(0,6);
    const ourWeaknesses = analyses.filter(x => x.type === "OUR_TEAM" && x.findingType === "WEAKNESS")
      .map(x => ({ ...x, score: this.score(x) })).sort((a,b) => b.score-a.score).slice(0,6);
    const opponentStrengths = analyses.filter(x => x.type === "OPPONENT" && x.findingType === "STRENGTH")
      .map(x => ({ ...x, score: this.score(x) })).sort((a,b) => b.score-a.score).slice(0,6);
    const opponentWeaknesses = analyses.filter(x => x.type === "OPPONENT" && x.findingType === "WEAKNESS")
      .map(x => ({ ...x, score: this.score(x) })).sort((a,b) => b.score-a.score).slice(0,6);

    const trainingResults = sessions.flatMap(session => session.behaviourResults.map(result => ({
      sessionId: session.id, sessionTitle: session.title, behaviour: result.behaviour,
      trainingSuccessRate: result.successRate, coachRating: result.coachRating,
    })));

    const ourEvidence = evidence.filter(x => x.analysisType === "OUR_TEAM");
    const decisive = ourEvidence.filter(x => ["progression","chance created","shot","goal","possession retained","recovery","possession lost","opponent progression","opponent chance"].includes((x.outcome ?? "").toLowerCase()));
    const success = decisive.filter(x => ["progression","chance created","shot","goal","possession retained","recovery"].includes((x.outcome ?? "").toLowerCase())).length;
    const matchSuccessRate = decisive.length ? Math.round(success / decisive.length * 100) : null;

    const transferResults = trainingResults.map(target => {
      const relevant = ourEvidence.filter(item => {
        const a = (target.behaviour ?? "").toLowerCase();
        const b = (item.behaviour ?? "").toLowerCase();
        return a && b && (a === b || a.includes(b) || b.includes(a));
      });
      const d = relevant.filter(x => x.outcome).length;
      const s = relevant.filter(x => ["progression","chance created","shot","goal","possession retained","recovery"].includes((x.outcome ?? "").toLowerCase())).length;
      const rate = d ? Math.round(s/d*100) : null;
      return { ...target, evidenceCount: relevant.length, matchSuccessRate: rate,
        status: relevant.length >= 3 && rate !== null ? (rate >= 70 ? "TRANSFERRED" : rate >= 50 ? "PARTIAL" : "NOT_TRANSFERRED") : "INSUFFICIENT_EVIDENCE" };
    });

    const transferSummary = {
      tracked: transferResults.length,
      transferred: transferResults.filter(x=>x.status==="TRANSFERRED").length,
      partial: transferResults.filter(x=>x.status==="PARTIAL").length,
      notTransferred: transferResults.filter(x=>x.status==="NOT_TRANSFERRED").length,
      insufficientEvidence: transferResults.filter(x=>x.status==="INSUFFICIENT_EVIDENCE").length,
    };

    const headline = match.status === "COMPLETED"
      ? "Post-match technical report"
      : "Pre-match technical intelligence report";

    return {
      modelVersion: "PROFESSIONAL_REPORT_V1",
      generatedAt: new Date().toISOString(),
      headline,
      match: {
        id: match.id, date: match.matchDate, status: match.status, venue: match.venue,
        score: match.ourScore != null && match.opponentScore != null ? `${match.ourScore}-${match.opponentScore}` : null,
        team: match.team, opponent: match.opponent, competition: match.competition, season: match.season,
      },
      executiveSummary: {
        analysisItems: analyses.length,
        evidenceItems: evidence.length,
        ourEvidenceItems: ourEvidence.length,
        tacticalGaps: gaps.length,
        trainingPriorities: priorities.length,
        trainingSessions: sessions.length,
        opponentScoutingMatches: scoutingMatches.length,
        matchEvidenceSuccessRate: matchSuccessRate,
      },
      tacticalPicture: {
        ourStrengths, ourWeaknesses, opponentStrengths, opponentWeaknesses,
        opportunities: gaps.filter(x=>x.type==="OPPORTUNITY").slice(0,6),
        threats: gaps.filter(x=>x.type==="THREAT").slice(0,6),
      },
      opponent: {
        sampleMatches: scoutingMatches.length,
        quality: scoutingMatches.length >= 5 ? "STRONG" : scoutingMatches.length >= 3 ? "GOOD" : scoutingMatches.length >= 1 ? "LIMITED" : "NO_DATA",
        matches: scoutingMatches.map(x=>({
          sequence:x.sequence, date:x.matchDate, opponent:x.externalOpponentName,
          score:x.opponentScore != null && x.externalScore != null ? `${x.opponentScore}-${x.externalScore}` : null,
          evidenceCount:x.evidence.length,
        })),
      },
      training: {
        priorities: priorities.slice(0,8),
        sessions: sessions.map(x=>({
          id:x.id,title:x.title,date:x.sessionDate,status:x.status,objective:x.objective,
          matchObjective:x.matchObjective,assessment:x.assessment,
          behaviourCount:x.behaviourResults.length, exerciseCount:x.exercises.length,
        })),
      },
      learningLoop: {
        modelVersion:"TRAINING_MATCH_LEARNING_LOOP_V1",
        results: transferResults,
        summary: transferSummary,
      },
      coachingRecommendations: [
        ...priorities.slice(0,3).map(x=>({priority:x.priority, action:x.objective, kpi:x.successKpi})),
        ...transferResults.filter(x=>x.status==="NOT_TRANSFERRED").map(x=>({priority:"HIGH",action:`Re-teach and reinforce ${x.behaviour} before the next representative match exposure.`})),
        ...transferResults.filter(x=>x.status==="PARTIAL").map(x=>({priority:"MEDIUM",action:`Increase representative repetitions for ${x.behaviour} and reduce coach intervention.`})),
      ].slice(0,8),
      reportSections: [
        "Executive Summary",
        "Tactical Picture",
        "Opponent Intelligence",
        "Training Response",
        "Behaviour Transfer",
        "Coaching Recommendations",
      ],
      governance: [
        "Report v1 is generated from traceable structured database records.",
        "No unsupported tactical conclusion is generated when evidence is absent.",
        "Training transfer is observational and rule-based; it does not claim causality.",
      ],
    };
  }
}
