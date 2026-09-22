import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateMatchDto } from "./dto/create-match.dto";

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMatchDto) {
    return this.prisma.match.create({
      data: {
        teamId: dto.teamId,
        seasonId: dto.seasonId,
        competitionId: dto.competitionId,
        opponentId: dto.opponentId,
        matchDate: new Date(dto.matchDate),
        venue: dto.venue,
        isHome: dto.isHome ?? true,
        formation: dto.formation
      },
      include: { opponent: true, team: true }
    });
  }

  findAll(teamId?: string) {
    return this.prisma.match.findMany({
      where: teamId ? { teamId } : undefined,
      orderBy: { matchDate: "desc" },
      include: { opponent: true, team: true }
    });
  }

  findOne(id: string) {
    return this.prisma.match.findUnique({
      where: { id },
      include: { opponent: true, team: true, analyses: true, evidence: true, gaps: true, priorities: true }
    });
  }
}
