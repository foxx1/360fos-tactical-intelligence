import { Module } from "@nestjs/common";
import { OpponentScoutingController } from "./opponent-scouting.controller";
import { OpponentScoutingService } from "./opponent-scouting.service";

@Module({
  controllers: [OpponentScoutingController],
  providers: [OpponentScoutingService],
  exports: [OpponentScoutingService],
})
export class OpponentScoutingModule {}
