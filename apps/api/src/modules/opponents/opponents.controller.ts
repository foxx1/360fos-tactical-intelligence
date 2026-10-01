import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { IsOptional, IsString, MinLength } from "class-validator";
import { OpponentsService } from "./opponents.service";

class CreateOpponentDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsString()
  teamId?: string;
}

@Controller("opponents")
export class OpponentsController {
  constructor(private readonly service: OpponentsService) {}

  @Get()
  async list(@Req() req: any) {
    return { success: true, data: await this.service.list(req.user.id) };
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateOpponentDto) {
    return { success: true, data: await this.service.create(req.user.id, dto) };
  }
}
