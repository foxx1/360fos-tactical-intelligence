import { Body, Controller, Get, Param, Post, Req } from "@nestjs/common";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";
import { TrainingService } from "./training.service";

@Controller("matches/:matchId/training-priorities")
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get()
  find(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.findPriorities(req.user.id, matchId) };
  }

  @Post()
  create(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateTrainingPriorityDto) {
    return { success: true, data: this.service.createPriority(req.user.id, matchId, dto) };
  }

  @Post("generate")
  generate(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.generateFromGaps(req.user.id, matchId) };
  }
}
