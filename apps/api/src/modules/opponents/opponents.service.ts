import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class OpponentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.opponent.findMany({
      where: { organization: { users: { some: { userId } } } },
      include: {
        team: {
          include: {
            competitionEntries: { include: { competition: true, season: true } },
          },
        },
        matches: { orderBy: { matchDate: "desc" }, take: 5 },
      },
      orderBy: { name: "asc" },
    });
  }

  async create(userId: string, body: { name?: string; teamId?: string }) {
    const org = await this.prisma.organization.findFirst({
      where: { users: { some: { userId } } },
    });
    if (!org) throw new NotFoundException("Organization not found");

    if (body.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: body.teamId, organizationId: org.id },
      });
      if (!team) throw new BadRequestException("Team not found in your organization.");

      return this.prisma.opponent.upsert({
        where: { organizationId_teamId: { organizationId: org.id, teamId: team.id } },
        update: { name: team.name },
        create: { organizationId: org.id, teamId: team.id, name: team.name },
        include: { team: true },
      });
    }

    const name = String(body.name || "").trim();
    if (!name) throw new BadRequestException("Team ID or opponent name is required.");

    return this.prisma.opponent.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { organizationId: org.id, name },
    });
  }
}
