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
  async findPriorities(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.findPriorities(req.user.id, matchId) };
  }

  @Post("training-priorities")
  async createPriority(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateTrainingPriorityDto) {
    return { success: true, data: await this.service.createPriority(req.user.id, matchId, dto) };
  }

  @Post("training-priorities/generate")
  async generatePriorities(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.generateFromGaps(req.user.id, matchId) };
  }

  @Get("training-sessions")
  async findSessions(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.findSessions(req.user.id, matchId) };
  }

  @Post("training-sessions")
  async createSession(@Req() req: any, @Param("matchId") matchId: string, @Body() dto: CreateTrainingSessionDto) {
    return { success: true, data: await this.service.createSession(req.user.id, matchId, dto) };
  }

  @Post("training-sessions/generate")
  async generateSession(@Req() req: any, @Param("matchId") matchId: string) {
    return { success: true, data: await this.service.generateSession(req.user.id, matchId) };
  }

  @Get("training-sessions/:sessionId")
  async getSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: await this.service.getSession(req.user.id, matchId, sessionId) };
  }

  @Patch("training-sessions/:sessionId")
  async updateSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() dto: UpdateTrainingSessionDto) {
    return { success: true, data: await this.service.updateSession(req.user.id, matchId, sessionId, dto) };
  }

  @Post("training-sessions/:sessionId/exercises")
  async createExercise(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() dto: CreateTrainingExerciseDto) {
    return { success: true, data: await this.service.createExercise(req.user.id, matchId, sessionId, dto) };
  }
  

  @Get("training-sessions/:sessionId/report")
  async getSessionReport(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: await this.service.getSessionReport(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/report/generate")
  async generateSessionReport(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: await this.service.generateSessionReport(req.user.id, matchId, sessionId) };
  }

  @Patch("training-sessions/:sessionId/assessment")
  async updateAssessment(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: any) {
    return { success: true, data: await this.service.updateAssessment(req.user.id, matchId, sessionId, body) };
  }

  @Post("training-sessions/:sessionId/behaviour-results")
  async recordBehaviourResult(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: any) {
    return { success: true, data: await this.service.recordBehaviourResult(req.user.id, matchId, sessionId, body) };
  }

  @Get("training-sessions/:sessionId/runtime")
  async getRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: await this.service.getRuntime(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/runtime/start")
  async startRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string) {
    return { success: true, data: await this.service.startRuntime(req.user.id, matchId, sessionId) };
  }

  @Post("training-sessions/:sessionId/runtime/pause")
  async pauseRuntime(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { elapsedSeconds?: number }) {
    return { success: true, data: await this.service.pauseRuntime(req.user.id, matchId, sessionId, body.elapsedSeconds ?? 0) };
  }

  @Post("training-sessions/:sessionId/runtime/exercise")
  async setCurrentExercise(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { exerciseId: string }) {
    return { success: true, data: await this.service.setCurrentExercise(req.user.id, matchId, sessionId, body.exerciseId) };
  }

  @Post("training-sessions/:sessionId/runtime/kpi")
  async recordKpi(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { result: string; value?: number; note?: string; minute?: number; exerciseId?: string }) {
    return { success: true, data: await this.service.recordKpi(req.user.id, matchId, sessionId, body) };
  }

  @Post("training-sessions/:sessionId/runtime/note")
  async addCoachNote(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { note: string }) {
    return { success: true, data: await this.service.addCoachNote(req.user.id, matchId, sessionId, body.note) };
  }

  @Post("training-sessions/:sessionId/runtime/complete")
  async completeSession(@Req() req: any, @Param("matchId") matchId: string, @Param("sessionId") sessionId: string, @Body() body: { elapsedSeconds?: number }) {
    return { success: true, data: await this.service.completeSession(req.user.id, matchId, sessionId, body.elapsedSeconds ?? 0) };
  }
}
