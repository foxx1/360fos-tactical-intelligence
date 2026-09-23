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

@Module({
  imports: [DatabaseModule, AuthModule, HealthModule, OrganizationsModule, TeamsModule, OpponentsModule, MatchesModule, AnalysisModule, EvidenceModule, IntelligenceModule, TrainingModule]
})
export class AppModule {}
