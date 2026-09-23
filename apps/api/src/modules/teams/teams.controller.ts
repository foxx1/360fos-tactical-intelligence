import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  list(@Req() req: any) { return { success: true, data: this.service.list(req.user.id) }; }

  @Post()
  create(@Req() req: any, @Body() body: { name: string }) {
    return { success: true, data: this.service.create(req.user.id, body.name) };
  }
}