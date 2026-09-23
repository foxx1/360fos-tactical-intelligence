import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { EvidenceModule } from "./modules/evidence/evidence.module";
import { HealthModule } from "./modules/health/health.module";
import { MatchesModule } from "./modules/matches/matches.module";

@Module({
  imports: [
    DatabaseModule,
    HealthModule,
    MatchesModule,
    AnalysisModule,
    EvidenceModule
  ]
})
export class AppModule {}
