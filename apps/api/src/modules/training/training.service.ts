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
}
