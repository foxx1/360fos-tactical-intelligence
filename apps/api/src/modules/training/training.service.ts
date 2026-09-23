import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  createPriority(matchId: string, dto: CreateTrainingPriorityDto) {
    return this.prisma.trainingPriority.create({
      data: { matchId, ...dto }
    });
  }

  findPriorities(matchId: string) {
    return this.prisma.trainingPriority.findMany({
      where: { matchId },
      orderBy: [{ priority: "asc" }, { rank: "asc" }]
    });
  }
}
