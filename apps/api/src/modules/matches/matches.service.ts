import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateMatchDto } from "./dto/create-match.dto";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrganizationId(userId: string) {
    const membership = await this.prisma.organizationUser.findFirst({
      where: { userId },
      select: { organizationId: true },
    });
    if (!membership) throw new NotFoundException("Organization not found");
    return membership.organizationId;
  }

  async create(userId: string, dto: CreateMatchDto) {
    const organizationId = await this.getOrganizationId(userId);

    const team = await this.prisma.team.findFirst({
      where: { id: dto.teamId, organizationId },
      select: { id: true },
    });
    const opponent = await this.prisma.opponent.findFirst({
      where: { id: dto.opponentId, organizationId },
      select: { id: true },
    });

    if (!team) throw new NotFoundException("Team not found in your organization");
    if (!opponent) throw new NotFoundException("Opponent not found in your organization");

    if (dto.seasonId) {
      const season = await this.prisma.season.findFirst({
        where: { id: dto.seasonId, teamId: dto.teamId },
        select: { id: true },
      });
      if (!season) throw new NotFoundException("Season not found for the selected team");
    }

    if (dto.competitionId) {
      const competition = await this.prisma.competition.findFirst({
        where: { id: dto.competitionId, organizationId },
        select: { id: true },
      });
      if (!competition) throw new NotFoundException("Competition not found in your organization");
    }

    return this.prisma.match.create({
      data: {
        teamId: dto.teamId,
        seasonId: dto.seasonId,
        competitionId: dto.competitionId,
        opponentId: dto.opponentId,
        matchDate: new Date(dto.matchDate),
        venue: dto.venue,
        isHome: dto.isHome ?? true,
        formation: dto.formation,
      },
      include: {
        opponent: true,
        team: true,
        season: true,
        competition: true,
      },
    });
  }

  async findAll(userId: string, teamId?: string) {
    const organizationId = await this.getOrganizationId(userId);

    return this.prisma.match.findMany({
      where: {
        team: {
          organizationId,
          ...(teamId ? { id: teamId } : {}),
        },
      },
      orderBy: { matchDate: "desc" },
      include: { opponent: true, team: true, season: true, competition: true },
    });
  }

  async findOne(userId: string, id: string) {
    const organizationId = await this.getOrganizationId(userId);

    return this.prisma.match.findFirst({
      where: { id, team: { organizationId } },
      include: {
        opponent: true,
        team: true,
        season: true,
        competition: true,
        analyses: true,
        evidence: true,
        gaps: true,
        priorities: true,
        _count: {
          select: {
            analyses: true,
            evidence: true,
            gaps: true,
            priorities: true,
          },
        },
      },
    });
  }
}
