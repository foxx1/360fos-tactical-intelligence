import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OpponentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.opponent.findMany({
      where: { organization: { users: { some: { userId } } } },
      include: { matches: { orderBy: { matchDate: 'desc' }, take: 5 } },
      orderBy: { name: 'asc' }
    });
  }

  async create(userId: string, name: string) {
    const org = await this.prisma.organization.findFirst({ where: { users: { some: { userId } } } });
    if (!org) throw new NotFoundException('Organization not found');
    return this.prisma.opponent.create({ data: { organizationId: org.id, name } });
  }
}