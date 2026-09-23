import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateEvidenceDto } from "./dto/create-evidence.dto";

@Injectable()
export class EvidenceService {
  constructor(private readonly prisma: PrismaService) {}

  create(matchId: string, dto: CreateEvidenceDto) {
    return this.prisma.evidence.create({
      data: { matchId, ...dto, phase: dto.phase }
    });
  }

  findByMatch(matchId: string) {
    return this.prisma.evidence.findMany({
      where: { matchId },
      orderBy: { minute: "asc" }
    });
  }
}
