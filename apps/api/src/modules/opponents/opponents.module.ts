import { Module } from '@nestjs/common';
import { OpponentsController } from './opponents.controller';
import { OpponentsService } from './opponents.service';

@Module({ controllers: [OpponentsController], providers: [OpponentsService] })
export class OpponentsModule {}