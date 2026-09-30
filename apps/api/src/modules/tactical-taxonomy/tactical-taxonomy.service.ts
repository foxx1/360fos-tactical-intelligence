import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class TacticalTaxonomyService {
  constructor(private readonly prisma: PrismaService) {}

  async getTree() {
    const principles = await this.prisma.tacticalPrinciple.findMany({
      where: { active: true },
      orderBy: [{ phase: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        subPrinciples: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            behaviours: {
              where: { active: true },
              orderBy: [{ name: "asc" }],
              select: {
                id: true,
                name: true,
                description: true,
                teamBehaviour: true,
              },
            },
          },
        },
      },
    });

    const phases = [
      "IN_POSSESSION",
      "OUT_OF_POSSESSION",
      "ATTACKING_TRANSITION",
      "DEFENSIVE_TRANSITION",
      "SET_PIECE",
    ] as const;

    const phaseNames: Record<(typeof phases)[number], string> = {
      IN_POSSESSION: "In Possession",
      OUT_OF_POSSESSION: "Out of Possession",
      ATTACKING_TRANSITION: "Attacking Transition",
      DEFENSIVE_TRANSITION: "Defensive Transition",
      SET_PIECE: "Set Piece",
    };

    return phases.map((phase) => ({
      id: phase,
      name: phaseNames[phase],
      principles: principles
        .filter((principle) => principle.phase === phase)
        .map((principle) => ({
          id: principle.id,
          name: principle.name,
          description: principle.description,
          sortOrder: principle.sortOrder,
          subPrinciples: principle.subPrinciples.map((subPrinciple) => ({
            id: subPrinciple.id,
            name: subPrinciple.name,
            description: subPrinciple.description,
            sortOrder: subPrinciple.sortOrder,
            behaviours: subPrinciple.behaviours,
          })),
        })),
    }));
  }

  async getPhases() {
    const tree = await this.getTree();
    return tree.map(({ id, name }) => ({ id, name }));
  }

  async getPrinciples(phase?: string) {
    return this.prisma.tacticalPrinciple.findMany({
      where: {
        active: true,
        ...(phase ? { phase: phase as any } : {}),
      },
      orderBy: [{ phase: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        phase: true,
        name: true,
        description: true,
        sortOrder: true,
      },
    });
  }

  async getSubPrinciples(principleId: string) {
    return this.prisma.tacticalSubPrinciple.findMany({
      where: { principleId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        principleId: true,
        name: true,
        description: true,
        sortOrder: true,
      },
    });
  }

  async getBehaviours(subPrincipleId: string) {
    return this.prisma.tacticalBehaviourDefinition.findMany({
      where: { subPrincipleId, active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        subPrincipleId: true,
        name: true,
        description: true,
        teamBehaviour: true,
      },
    });
  }
}
