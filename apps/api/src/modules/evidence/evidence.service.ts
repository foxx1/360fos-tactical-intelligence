import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMatchAccess(userId: string, matchId: string) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, team: { organization: { users: { some: { userId } } } } },
      select: { id: true },
    });
    if (!match) throw new NotFoundException("Match not found");
  }

  async create(userId: string, matchId: string, dto: CreateEvidenceDto) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.evidence.create({ data: { matchId, ...dto } });
  }

  async findByMatch(userId: string, matchId: string) {
    await this.assertMatchAccess(userId, matchId);
    return this.prisma.evidence.findMany({ where: { matchId }, orderBy: { minute: "asc" } });
  }
}
