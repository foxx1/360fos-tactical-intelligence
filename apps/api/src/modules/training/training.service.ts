import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMatchAccess(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true },
    });
    if (!match) throw new NotFoundException("Match not found");
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

    if (!gaps.length) {
      return {
        generated: 0,
        message: "Approve at least one tactical gap before generating the training plan.",
        priorities: [],
      };
    }

    const existing = await this.prisma.trainingPriority.findMany({
      where: { matchId },
      select: { evidence: true },
    });

    const created = [];
    for (const gap of gaps) {
      const marker = "gap-training:" + gap.id;
      if (existing.some((item) => item.evidence?.includes(marker))) continue;

      const isOpportunity = gap.type === "OPPORTUNITY";
      const objective = gap.trainingObjective ??
        (isOpportunity
          ? "Train the team to exploit " + (gap.opponentWeakness ?? "the identified opponent weakness") + " through " + (gap.ourStrength ?? "our identified strength") + "."
          : "Train the team to control " + (gap.opponentStrength ?? "the identified opponent strength") + " while improving " + (gap.ourWeakness ?? "the vulnerable behaviour") + ".");

      const principle = gap.tacticalPrinciple ?? (isOpportunity
        ? "Exploit → attract → isolate → penetrate → finish the action."
        : "Press/cover/balance → deny access → regain control.");

      const playerBehaviour = gap.playerBehaviour ?? (isOpportunity
        ? "Perceive the opponent weakness early, choose the correct action, and execute at speed."
        : "Perceive the threat early, communicate, adjust body position, and execute the defensive action.");

      const teamBehaviour = gap.teamBehaviour ?? (isOpportunity
        ? "Create the conditions to isolate the target area and attack with support."
        : "Protect the vulnerable space with coordinated pressure, cover and balance.");

      const constraint = isOpportunity
        ? "Reward the attacking team only when the target weakness is attacked within 5 seconds of recognition."
        : "Restart if the defensive unit fails to provide pressure, cover or balance within 5 seconds.";

      const successKpi = isOpportunity
        ? "Target behaviour appears in at least 70% of representative repetitions with successful penetration or final action."
        : "Defensive unit prevents the target progression in at least 70% of representative repetitions.";

      const priority = gap.priority;
      const rank = created.length + 1;

      const priorityRecord = await this.prisma.trainingPriority.create({
        data: {
          matchId,
          rank,
          priority,
          problem: isOpportunity
            ? "Exploit: " + (gap.opponentWeakness ?? gap.interaction)
            : "Protect: " + (gap.opponentStrength ?? gap.interaction),
          evidence: marker + " | Tactical gap: " + gap.interaction,
          diagnosis: (gap.opportunity ?? gap.threat ?? gap.interaction) + ".",
          objective,
          exerciseType: isOpportunity
            ? "Game-based attacking tactical exercise"
            : "Game-based defensive tactical exercise",
          constraint,
          players: isOpportunity
            ? "Relevant attacking unit + opposition defenders"
            : "Relevant defensive unit + opposition attackers",
          durationMinutes: 15,
          intensity: "High",
          successKpi,
          matchObjective: gap.matchObjective ?? (isOpportunity
            ? "Reproduce the attacking behaviour in the match when the opponent weakness appears."
            : "Prevent the opponent strength from producing the target progression in the match."),
          sessionDay: "MD-3",
        },
      });

      created.push(priorityRecord);
    }

    return {
      generated: created.length,
      message: created.length
        ? "Approved tactical gaps converted into draft training priorities."
        : "Training priorities are already generated for the approved tactical gaps.",
      priorities: created,
    };
  }
}
