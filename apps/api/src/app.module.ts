import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthModule } from "./modules/health/health.module";
import { MatchesModule } from "./modules/matches/matches.module";

@Module({
  imports: [DatabaseModule, HealthModule, MatchesModule]
})
export class AppModule {}
