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
  

  @Get("training-sessions/:sessionId/report")
  getSessionReport(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: this.service.getSessionReport(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/report/generate")
  generateSessionReport(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: this.service.generateSessionReport(req.user.id, matchId, sessionId) };
  }

  @Patch("training-sessions/:sessionId/assessment")
  updateAssessment(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: any) {
    return { success: true, data: this.service.updateAssessment(req.user.id, matchId, sessionId, body) };
  }

  @Post("training-sessions/:sessionId/behaviour-results")
  recordBehaviourResult(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: any) {
    return { success: true, data: this.service.recordBehaviourResult(req.user.id, matchId, sessionId, body) };
  }

  @Get("training-sessions/:sessionId/runtime")
  getRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: this.service.getRuntime(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/runtime/start")
  startRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: this.service.startRuntime(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/runtime/pause")
  pauseRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { elapsedSeconds?: number }) {
    return { success: true, data: this.service.pauseRuntime(req.user.id, matchId, sessionId, body.elapsedSeconds ?? 0) };
  }

  @Post("training-sessions/:sessionId/runtime/exercise")
  setCurrentExercise(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { exerciseId: string }) {
    return { success: true, data: this.service.setCurrentExercise(req.user.id, matchId, sessionId, body.exerciseId) };
  }

  @Post("training-sessions/:sessionId/runtime/kpi")
  recordKpi(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { result: string; value?: number; note?: string; minute?: number; exerciseId?: string }) {
    return { success: true, data: this.service.recordKpi(req.user.id, matchId, sessionId, body) };
  }

  @Post("training-sessions/:sessionId/runtime/note")
  addCoachNote(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { note: string }) {
    return { success: true, data: this.service.addCoachNote(req.user.id, matchId, sessionId, body.note) };
  }

  @Post("training-sessions/:sessionId/runtime/complete")
  completeSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { elapsedSeconds?: number }) {
    return { success: true, data: this.service.completeSession(req.user.id, matchId, sessionId, body.elapsedSeconds ?? 0) };
  }
}
