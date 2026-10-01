import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { EvidenceModule } from './modules/evidence/evidence.module';
import { HealthModule } from './modules/health/health.module';
import { IntelligenceModule } from './modules/intelligence/intelligence.module';
import { MatchesModule } from './modules/matches/matches.module';
import { TrainingModule } from './modules/training/training.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { TeamsModule } from './modules/teams/teams.module';
import { OpponentsModule } from './modules/opponents/opponents.module';
import { CompetitionsModule } from './modules/competitions/competitions.module';
import { TacticalTaxonomyModule } from './modules/tactical-taxonomy/tactical-taxonomy.module';
import { OpponentScoutingModule } from './modules/opponent-scouting/opponent-scouting.module';
import { MatchPlanModule } from './modules/match-plan/match-plan.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    HealthModule,
    OrganizationsModule,
    TeamsModule,
    OpponentsModule,
    CompetitionsModule,
    MatchesModule,
    AnalysisModule,
    EvidenceModule,
    IntelligenceModule,
    TrainingModule,
    TacticalTaxonomyModule,
    OpponentScoutingModule,
    MatchPlanModule,
  ],
})
export class AppModule {}
