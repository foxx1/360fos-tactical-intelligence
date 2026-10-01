import { Module } from "@nestjs/common";
import { IntelligenceModule } from "../intelligence/intelligence.module";
import { OpponentScoutingModule } from "../opponent-scouting/opponent-scouting.module";
import { MatchPlanController } from "./match-plan.controller";
import { MatchPlanService } from "./match-plan.service";

@Module({
  imports: [IntelligenceModule, OpponentScoutingModule],
  controllers: [MatchPlanController],
  providers: [MatchPlanService],
})
export class MatchPlanModule {}
