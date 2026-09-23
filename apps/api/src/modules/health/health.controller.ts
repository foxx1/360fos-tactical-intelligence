import { Controller, Get } from '@nestjs/common';
import { Public } from '../../auth/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  getHealth() {
    return { success: true, data: { service: '360FOS Tactical Intelligence API', status: 'ok' } };
  }
}
