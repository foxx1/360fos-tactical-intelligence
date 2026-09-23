import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.competition.findMany({
      where: { organization: { users: { some: { userId } } } },
      orderBy: { name: "asc" },
    });
  }

  async create(userId: string, name: string) {
    const org = await this.prisma.organization.findFirst({
      where: { users: { some: { userId } } },
    });
    if (!org) throw new NotFoundException("Organization not found");

    return this.prisma.competition.upsert({
      where: { organizationId_name: { organizationId: org.id, name } },
      update: {},
      create: { organizationId: org.id, name },
    });
  }
}
