import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { OpponentsService } from './opponents.service';

@Controller('opponents')
export class OpponentsController {
  constructor(private readonly service: OpponentsService) {}

  @Get()
  async list(@Req() req: any) {
    return { success: true, data: await this.service.list(req.user.id) };
  }

  @Post()
  async create(@Req() req: any, @Body() body: { name: string }) {
    return { success: true, data: await this.service.create(req.user.id, body.name) };
  }
}
