import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";
import { TrainingService } from "./training.service";

@Controller("matches/:matchId/training-priorities")
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get()
  find(@Param("matchId") matchId: string) {
    return { success: true, data: this.service.findPriorities(matchId) };
  }

  @Post()
  create(@Param("matchId") matchId: string, @Body() dto: CreateTrainingPriorityDto) {
    return { success: true, data: this.service.createPriority(matchId, dto) };
  }
}
