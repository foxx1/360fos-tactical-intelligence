import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganization(userId: string) {
    const org = await this.prisma.organization.findFirst({
      where: { users: { some: { userId } } },
    });
    if (!org) throw new NotFoundException("Organization not found");
    return org;
  }

  list(userId: string) {
    return this.prisma.team.findMany({
      where: { organization: { users: { some: { userId } } } },
      include: {
        seasons: true,
        competitionEntries: {
          include: { competition: true, season: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    });
  }

  async get(userId: string, id: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organization: { users: { some: { userId } } } },
      include: {
        seasons: true,
        competitionEntries: { include: { competition: true, season: true } },
        opponents: true,
      },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  async create(userId: string, body: any) {
    const org = await this.getOrganization(userId);
    const name = String(body.name || "").trim();
    if (!name) throw new BadRequestException("Team name is required.");

    const seasonName = body.seasonName ? String(body.seasonName).trim() : "";
    const competitionId = body.competitionId ? String(body.competitionId) : "";
    const competitionName = body.competitionName ? String(body.competitionName).trim() : "";

    return this.prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          organizationId: org.id,
          name,
          shortName: body.shortName?.trim() || null,
          country: body.country?.trim() || null,
          clubName: body.clubName?.trim() || null,
          gender: body.gender || "MEN",
          category: body.category || "FIRST_TEAM",
          aliases: Array.isArray(body.aliases) ? body.aliases.map((x: string) => x.trim()).filter(Boolean) : [],
        },
      });

      if (!seasonName) return team;

      const season = await tx.season.create({
        data: { teamId: team.id, name: seasonName },
      });

      let competition = null;
      if (competitionId) {
        competition = await tx.competition.findFirst({
          where: { id: competitionId, organizationId: org.id },
        });
        if (!competition) throw new BadRequestException("Competition not found.");
      } else if (competitionName) {
        competition = await tx.competition.upsert({
          where: { organizationId_name: { organizationId: org.id, name: competitionName } },
          update: {},
          create: { organizationId: org.id, name: competitionName },
        });
      }

      if (competition) {
        await tx.teamCompetition.create({
          data: { teamId: team.id, competitionId: competition.id, seasonId: season.id },
        });
      }

      return tx.team.findUnique({
        where: { id: team.id },
        include: {
          seasons: true,
          competitionEntries: { include: { competition: true, season: true } },
        },
      });
    });
  }
}
