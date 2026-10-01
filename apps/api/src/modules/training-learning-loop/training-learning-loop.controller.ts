import { Controller, Get, Param, Req } from "@nestjs/common";
import { TrainingLearningLoopService } from "./training-learning-loop.service";

@Controller("matches/:matchId/learning-loop")
export class TrainingLearningLoopController {
  constructor(private readonly service: TrainingLearningLoopService) {}

  @Get()
  async getLoop(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.getLoop(req.user.id, matchId) };
  }
}
