import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMine(userId: string) {
    return this.prisma.organization.findFirst({
      where: { users: { some: { userId } } },
      include: { teams: { include: { seasons: true } }, opponents: true, competitions: true }
    });
  }

  async create(userId: string, name: string, teamName: string, seasonName?: string) {
    const existing = await this.getMine(userId);
    if (existing) return existing;

    return this.prisma.organization.create({
      data: {
        name,
        users: { create: { userId, role: 'OWNER' } },
        teams: {
          create: {
            name: teamName,
            seasons: seasonName ? { create: { name: seasonName } } : undefined
          }
        }
      },
      include: { teams: { include: { seasons: true } }, opponents: true, competitions: true }
    });
  }
}