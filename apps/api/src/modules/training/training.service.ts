import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { UpdateTrainingSessionDto } from "./dto/update-training-session.dto";
import { CreateTrainingExerciseDto } from "./dto/create-training-exercise.dto";

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMatchAccess(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true, opponent: { select: { name: true } } },
    });
    if (!match) throw new NotFoundException("Match not found");
    return match;
  }

  async createPriority(userId: string, matchId: string, dto: CreateTrainingPriorityDto) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.trainingPriority.create({ data: { matchId, ...dto } });
  }

  async findPriorities(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.trainingPriority.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { rank: "asc" }, { createdAt: "desc" }],
    });
  }

  async generateFromGaps(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    const gaps = await this.prisma.tacticalGap.findMany({
      where: { matchId, status: "APPROVED" },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });
    if (!gaps.length) return { generated: 0, message: "Approve at least one tactical gap before generating the training plan.", priorities: [] };

    const existing = await this.prisma.trainingPriority.findMany({ where: { matchId }, select: { evidence: true } });
    const created = [];
    for (const gap of gaps) {
      const marker = "gap-training:" + gap.id;
      if (existing.some((item) => item.evidence?.includes(marker))) continue;
      const isOpportunity = gap.type === "OPPORTUNITY";
      const objective = gap.trainingObjective ?? (isOpportunity
        ? "Train the team to exploit " + (gap.opponentWeakness ?? "the identified opponent weakness") + " through " + (gap.ourStrength ?? "our identified strength") + "."
        : "Train the team to control " + (gap.opponentStrength ?? "the identified opponent strength") + " while improving " + (gap.ourWeakness ?? "the vulnerable behaviour") + ".");
      const principle = gap.tacticalPrinciple ?? (isOpportunity ? "Exploit → attract → isolate → penetrate → finish the action." : "Press/cover/balance → deny access → regain control.");
      const playerBehaviour = gap.playerBehaviour ?? (isOpportunity ? "Perceive the opponent weakness early, choose the correct action, and execute at speed." : "Perceive the threat early, communicate, adjust body position, and execute the defensive action.");
      const teamBehaviour = gap.teamBehaviour ?? (isOpportunity ? "Create the conditions to isolate the target area and attack with support." : "Protect the vulnerable space with coordinated pressure, cover and balance.");
      const constraint = isOpportunity ? "Reward the attacking team only when the target weakness is attacked within 5 seconds of recognition." : "Restart if the defensive unit fails to provide pressure, cover or balance within 5 seconds.";
      const successKpi = isOpportunity ? "Target behaviour appears in at least 70% of representative repetitions with successful penetration or final action." : "Defensive unit prevents the target progression in at least 70% of representative repetitions.";
      const priorityRecord = await this.prisma.trainingPriority.create({
        data: {
          matchId, rank: created.length + 1, priority: gap.priority,
          problem: isOpportunity ? "Exploit: " + (gap.opponentWeakness ?? gap.interaction) : "Protect: " + (gap.opponentStrength ?? gap.interaction),
          evidence: marker + " | Tactical gap: " + gap.interaction,
          diagnosis: (gap.opportunity ?? gap.threat ?? gap.interaction) + ".",
          objective, exerciseType: isOpportunity ? "Game-based attacking tactical exercise" : "Game-based defensive tactical exercise",
          constraint, players: isOpportunity ? "Relevant attacking unit + opposition defenders" : "Relevant defensive unit + opposition attackers",
          durationMinutes: 15, intensity: "High", successKpi,
          matchObjective: gap.matchObjective ?? (isOpportunity ? "Reproduce the attacking behaviour in the match when the opponent weakness appears." : "Prevent the opponent strength from producing the target progression in the match."),
          sessionDay: "MD-3",
        },
      });
      created.push(priorityRecord);
    }
    return { generated: created.length, message: created.length ? "Approved tactical gaps converted into draft training priorities." : "Training priorities are already generated for the approved tactical gaps.", priorities: created };
  }

  async findSessions(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.trainingSession.findMany({
      where: { matchId },
      include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
      orderBy: [{ sessionDate: "asc" }, { createdAt: "desc" }],
    });
  }

  async getSession(userId: string, matchId: string, sessionId: string) {
    await this.assertMatchAccess(userId, matchId);
    const session = await this.prisma.trainingSession.findFirst({
      where: { id: sessionId, matchId },
      include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
    });
    if (!session) throw new NotFoundException("Training session not found");
    return session;
  }

  async createSession(userId: string, matchId: string, dto: CreateTrainingSessionDto) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.trainingSession.create({
      data: { matchId, ...dto, sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : undefined },
      include: { exercises: true },
    });
  }

  async updateSession(userId: string, matchId: string, sessionId: string, dto: UpdateTrainingSessionDto) {
    await this.getSession(userId, matchId, sessionId);
    return this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: { ...dto, sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : undefined },
      include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
    });
  }

  async createExercise(userId: string, matchId: string, sessionId: string, dto: CreateTrainingExerciseDto) {
    await this.getSession(userId, matchId, sessionId);
    if (dto.trainingPriorityId) {
      const p = await this.prisma.trainingPriority.findFirst({ where: { id: dto.trainingPriorityId, matchId } });
      if (!p) throw new NotFoundException("Training priority not found");
    }
    if (dto.tacticalGapId) {
      const g = await this.prisma.tacticalGap.findFirst({ where: { id: dto.tacticalGapId, matchId } });
      if (!g) throw new NotFoundException("Tactical gap not found");
    }
    const order = dto.exerciseOrder ?? ((await this.prisma.trainingExercise.count({ where: { sessionId } })) + 1);
    return this.prisma.trainingExercise.create({
      data: { sessionId, ...dto, exerciseOrder: order },
    });
  }

  async generateSession(userId: string, matchId: string) {
    const match = await this.assertMatchAccess(userId, matchId);
    const priorities = await this.prisma.trainingPriority.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { rank: "asc" }],
      take: 3,
    });
    if (!priorities.length) {
      return { generated: false, message: "Generate training priorities first.", session: null };
    }

    const existing = await this.prisma.trainingSession.findFirst({
      where: { matchId, status: "DRAFT", title: { startsWith: "MD-3 Tactical Session" } },
      select: { id: true },
    });
    if (existing) return { generated: false, message: "A draft MD-3 tactical session already exists.", session: await this.getSession(userId, matchId, existing.id) };

    const primary = priorities[0];
    const exercises = [
      {
        phase: "ACTIVATION" as const, title: "Perception & Decision Activation",
        objective: "Prime scanning, communication and rapid perception before the tactical work.",
        durationMinutes: 8, organization: "Dynamic activation in positional pairs/triads", players: "Full relevant squad",
        constraints: "Information cue must trigger an immediate change of action.",
        coachingPoints: "Scan before receiving; body orientation; communicate early.",
        successKpi: "Fast, accurate responses in at least 80% of repetitions.",
        matchBehaviour: primary.matchObjective ?? primary.objective,
      },
      {
        phase: "POSITIONAL" as const, title: "Tactical Pattern: " + primary.problem,
        objective: primary.objective, durationMinutes: 12,
        organization: "Positional unit with opposition reference players", players: primary.players,
        constraints: primary.constraint, coachingPoints: [primary.diagnosis, primary.objective, primary.successKpi].filter(Boolean).join(" | "),
        successKpi: primary.successKpi, matchBehaviour: primary.matchObjective ?? primary.objective,
      },
      {
        phase: "MAIN_GAME" as const, title: "Game-Based Tactical Problem",
        objective: "Transfer the priority into a representative game with realistic opposition behaviour.",
        durationMinutes: 18, organization: "Small-sided game with directional targets", players: primary.players,
        constraints: primary.constraint, coachingPoints: "Recognise the trigger; coordinate the unit; execute at match speed.",
        successKpi: primary.successKpi, matchBehaviour: primary.matchObjective ?? primary.objective,
      },
      {
        phase: "CONDITIONED_GAME" as const, title: "Constraint Game: Match Scenario",
        objective: "Increase tactical pressure and force repeated decisions under realistic constraints.",
        durationMinutes: 18, organization: "Conditioned game", players: "Relevant units + opposition",
        constraints: primary.constraint + " Coach intervenes only on repeated tactical failure.",
        coachingPoints: "Perceive → decide → execute; maintain team connection.",
        successKpi: primary.successKpi, matchBehaviour: primary.matchObjective ?? primary.objective,
      },
      {
        phase: "FINAL_GAME" as const, title: "Free Game + KPI Validation",
        objective: "Validate whether the target behaviour survives without continuous coaching.",
        durationMinutes: 12, organization: "Full or reduced game, minimal stoppages", players: "Full relevant squad",
        constraints: "Coach tracks KPI and only records evidence unless safety or tactical clarity requires intervention.",
        coachingPoints: "Observe transfer into game behaviour.",
        successKpi: primary.successKpi, matchBehaviour: primary.matchObjective ?? primary.objective,
      },
    ];

    const session = await this.prisma.trainingSession.create({
      data: {
        matchId,
        title: "MD-3 Tactical Session vs " + match.opponent.name,
        sessionDay: primary.sessionDay ?? "MD-3",
        totalDurationMinutes: exercises.reduce((s, e) => s + e.durationMinutes, 0),
        intensity: primary.intensity ?? "High",
        objective: primary.objective,
        matchObjective: primary.matchObjective,
        status: "DRAFT",
        exercises: { create: exercises.map((e, i) => ({ ...e, exerciseOrder: i + 1, trainingPriorityId: primary.id })) },
      },
      include: { exercises: { orderBy: { exerciseOrder: "asc" } } },
    });

    return { generated: true, message: "Draft training session generated from the current training priority.", session };
  }
  async getRuntime(userId: string, matchId: string, sessionId: string) {
    await this.getSession(userId, matchId, sessionId);
    let runtime = await this.prisma.trainingSessionRuntime.findUnique({
      where: { sessionId },
      include: { kpiEvents: { orderBy: { createdAt: "desc" } } },
    });
    if (!runtime) {
      const session = await this.getSession(userId, matchId, sessionId);
      runtime = await this.prisma.trainingSessionRuntime.create({
        data: { sessionId, currentExerciseId: session.exercises[0]?.id },
        include: { kpiEvents: { orderBy: { createdAt: "desc" } } },
      });
    }
    return runtime;
  }

  async startRuntime(userId: string, matchId: string, sessionId: string) {
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    const now = new Date();
    return this.prisma.trainingSessionRuntime.update({
      where: { id: runtime.id },
      data: { startedAt: runtime.startedAt ?? now, pausedAt: null },
      include: { kpiEvents: { orderBy: { createdAt: "desc" } } },
    });
  }

  async pauseRuntime(userId: string, matchId: string, sessionId: string, elapsedSeconds: number) {
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    return this.prisma.trainingSessionRuntime.update({
      where: { id: runtime.id },
      data: { pausedAt: new Date(), elapsedSeconds: Math.max(0, elapsedSeconds) },
      include: { kpiEvents: { orderBy: { createdAt: "desc" } } },
    });
  }

  async setCurrentExercise(userId: string, matchId: string, sessionId: string, exerciseId: string) {
    const session = await this.getSession(userId, matchId, sessionId);
    if (!session.exercises.some((e) => e.id === exerciseId)) throw new NotFoundException("Exercise not found in session");
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    return this.prisma.trainingSessionRuntime.update({
      where: { id: runtime.id },
      data: { currentExerciseId: exerciseId, pausedAt: null },
    });
  }

  async recordKpi(userId: string, matchId: string, sessionId: string, dto: { result: string; value?: number; note?: string; minute?: number; exerciseId?: string }) {
    const session = await this.getSession(userId, matchId, sessionId);
    if (dto.exerciseId && !session.exercises.some((e) => e.id === dto.exerciseId)) throw new NotFoundException("Exercise not found in session");
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    const event = await this.prisma.trainingKpiEvent.create({
      data: { runtimeId: runtime.id, exerciseId: dto.exerciseId ?? runtime.currentExerciseId ?? undefined, result: dto.result, value: dto.value, note: dto.note, minute: dto.minute },
    });
    const success = dto.result.toUpperCase() === "SUCCESS";
    await this.prisma.trainingSessionRuntime.update({
      where: { id: runtime.id },
      data: { successfulReps: { increment: success ? 1 : 0 }, failedReps: { increment: success ? 0 : 1 } },
    });
    return event;
  }

  async addCoachNote(userId: string, matchId: string, sessionId: string, note: string) {
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    return this.prisma.trainingSessionRuntime.update({ where: { id: runtime.id }, data: { coachNotes: note } });
  }

  async completeSession(userId: string, matchId: string, sessionId: string, elapsedSeconds: number) {
    await this.getSession(userId, matchId, sessionId);
    await this.getRuntime(userId, matchId, sessionId);
    return this.prisma.$transaction(async (tx) => {
      await tx.trainingSessionRuntime.updateMany({ where: { sessionId }, data: { pausedAt: new Date(), elapsedSeconds } });
      return tx.trainingSession.update({ where: { id: sessionId }, data: { status: "COMPLETED" }, include: { exercises: { orderBy: { exerciseOrder: "asc" } }, runtime: { include: { kpiEvents: { orderBy: { createdAt: "asc" } } } } } });
    });
  }


  async getSessionReport(userId: string, matchId: string, sessionId: string) {
    const session = await this.getSession(userId, matchId, sessionId);
    const runtime = await this.prisma.trainingSessionRuntime.findUnique({
      where: { sessionId },
      include: { kpiEvents: { orderBy: { createdAt: "asc" } } },
    });
    const assessment = await this.prisma.trainingSessionAssessment.findUnique({ where: { sessionId } });
    const behaviours = await this.prisma.trainingBehaviourResult.findMany({ where: { sessionId }, orderBy: { createdAt: "asc" } });
    const actions = await this.prisma.trainingLearningAction.findMany({ where: { sessionId }, orderBy: { createdAt: "desc" } });
    const total = (runtime?.successfulReps ?? 0) + (runtime?.failedReps ?? 0);
    const successRate = total ? Math.round(((runtime?.successfulReps ?? 0) / total) * 100) : 0;
    const targetRate = 70;
    const transfer = successRate >= targetRate ? "VALIDATED" : successRate >= 55 ? "PARTIALLY_VALIDATED" : "NOT_VALIDATED";
    return {
      session,
      runtime,
      assessment,
      behaviours,
      actions,
      summary: { successRate, targetRate, totalReps: total, transferRating: transfer, status: session.status },
    };
  }

  async generateSessionReport(userId: string, matchId: string, sessionId: string) {
    const session = await this.getSession(userId, matchId, sessionId);
    const runtime = await this.getRuntime(userId, matchId, sessionId);
    const total = runtime.successfulReps + runtime.failedReps;
    const successRate = total ? Math.round((runtime.successfulReps / total) * 100) : 0;
    const targetRate = 70;
    const transferRating = successRate >= targetRate ? "VALIDATED" : successRate >= 55 ? "PARTIALLY_VALIDATED" : "NOT_VALIDATED";
    const matchReadiness = transferRating === "VALIDATED" ? "READY_TO_TRANSFER" : transferRating === "PARTIALLY_VALIDATED" ? "REQUIRES_REINFORCEMENT" : "REQUIRES_RETEACHING";
    const result = transferRating === "VALIDATED" ? "PROGRESS" : transferRating === "PARTIALLY_VALIDATED" ? "KEEP" : "RE-TEACH";
    const recommendation = transferRating === "VALIDATED"
      ? "Progress the behaviour into the next representative session and validate it against match-specific opposition cues."
      : transferRating === "PARTIALLY_VALIDATED"
        ? "Keep the same tactical objective but increase representative repetitions and reduce coach intervention."
        : "Re-teach the behaviour with simpler constraints before progressing to a full game.";
    const assessment = await this.prisma.trainingSessionAssessment.upsert({
      where: { sessionId },
      create: { sessionId, overallScore: successRate, transferRating, coachAssessment: runtime.coachNotes, issues: runtime.failedReps ? "The target behaviour still produced failed repetitions during the session." : null, nextAction: recommendation, matchReadiness, strengths: runtime.successfulReps ? "The target behaviour produced successful repetitions under the session constraints." : null },
      update: { overallScore: successRate, transferRating, coachAssessment: runtime.coachNotes, issues: runtime.failedReps ? "The target behaviour still produced failed repetitions during the session." : null, nextAction: recommendation, matchReadiness, strengths: runtime.successfulReps ? "The target behaviour produced successful repetitions under the session constraints." : null },
    });
    const priority = await this.prisma.trainingPriority.findFirst({ where: { matchId }, orderBy: [{ priority: "asc" }, { rank: "asc" }] });
    const gap = priority ? await this.prisma.tacticalGap.findFirst({ where: { matchId, OR: [{ trainingObjective: { contains: priority.objective, mode: "insensitive" } }, { matchObjective: { contains: priority.matchObjective ?? priority.objective, mode: "insensitive" } }] }, orderBy: { createdAt: "asc" } }) : null;
    await this.prisma.trainingLearningAction.deleteMany({ where: { sessionId } });
    await this.prisma.trainingLearningAction.create({ data: { sessionId, sourcePriorityId: priority?.id, sourceGapId: gap?.id, result, recommendation } });
    return this.getSessionReport(userId, matchId, sessionId);
  }

  async recordBehaviourResult(userId: string, matchId: string, sessionId: string, dto: { exerciseId?: string; behaviour: string; targetKpi?: string; successfulReps?: number; failedReps?: number; coachRating?: number; observation?: string }) {
    const session = await this.getSession(userId, matchId, sessionId);
    if (dto.exerciseId && !session.exercises.some((e) => e.id === dto.exerciseId)) throw new NotFoundException("Exercise not found in session");
    const success = dto.successfulReps ?? 0;
    const failure = dto.failedReps ?? 0;
    const total = success + failure;
    return this.prisma.trainingBehaviourResult.create({
      data: { sessionId, exerciseId: dto.exerciseId, behaviour: dto.behaviour, targetKpi: dto.targetKpi, successfulReps: success, failedReps: failure, successRate: total ? (success / total) * 100 : 0, coachRating: dto.coachRating, observation: dto.observation },
    });
  }

  async updateAssessment(userId: string, matchId: string, sessionId: string, dto: { overallScore?: number; transferRating?: string; coachAssessment?: string; strengths?: string; issues?: string; nextAction?: string; matchReadiness?: string }) {
    await this.getSession(userId, matchId, sessionId);
    return this.prisma.trainingSessionAssessment.upsert({
      where: { sessionId },
      create: { sessionId, ...dto },
      update: dto,
    });
  }

}
