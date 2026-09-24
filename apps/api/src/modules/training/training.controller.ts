import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { CreateTrainingPriorityDto } from "./dto/create-training-priority.dto";
import { CreateTrainingSessionDto } from "./dto/create-training-session.dto";
import { UpdateTrainingSessionDto } from "./dto/update-training-session.dto";
import { CreateTrainingExerciseDto } from "./dto/create-training-exercise.dto";
import { TrainingService } from "./training.service";

@Controller("matches/:matchId")
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get("training-priorities")
  findPriorities(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.findPriorities(req.user.id, matchId) };
  }

  @Post("training-priorities")
  createPriority(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateTrainingPriorityDto) {
    return { success: true, data: this.service.createPriority(req.user.id, matchId, dto) };
  }

  @Post("training-priorities/generate")
  generatePriorities(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.generateFromGaps(req.user.id, matchId) };
  }

  @Get("training-sessions")
  findSessions(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.findSessions(req.user.id, matchId) };
  }

  @Post("training-sessions")
  createSession(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateTrainingSessionDto) {
    return { success: true, data: this.service.createSession(req.user.id, matchId, dto) };
  }

  @Post("training-sessions/generate")
  generateSession(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: this.service.generateSession(req.user.id, matchId) };
  }

  @Get("training-sessions/:sessionId")
  getSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: this.service.getSession(req.user.id, matchId, sessionId) };
  }

  @Patch("training-sessions/:sessionId")
  updateSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() dto: UpdateTrainingSessionDto) {
    return { success: true, data: this.service.updateSession(req.user.id, matchId, sessionId, dto) };
  }

  @Post("training-sessions/:sessionId/exercises")
  createExercise(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() dto: CreateTrainingExerciseDto) {
    return { success: true, data: this.service.createExercise(req.user.id, matchId, sessionId, dto) };
  }
}
