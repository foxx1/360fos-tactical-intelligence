import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get('me')
  async me(@Req() req: any) {
    return { success: true, data: await this.service.getMine(req.user.id) };
  }

  @Post('onboard')
  async onboard(@Req() req: any, @Body() body: { name: string; teamName: string; seasonName?: string }) {
    return {
      success: true,
      data: await this.service.create(req.user.id, body.name, body.teamName, body.seasonName)
    };
  }
}