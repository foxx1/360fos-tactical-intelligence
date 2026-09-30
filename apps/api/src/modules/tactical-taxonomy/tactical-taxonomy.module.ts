import { Module } from "@nestjs/common";
import { TacticalTaxonomyController } from "./tactical-taxonomy.controller";
import { TacticalTaxonomyService } from "./tactical-taxonomy.service";

@Module({
  controllers: [TacticalTaxonomyController],
  providers: [TacticalTaxonomyService],
  exports: [TacticalTaxonomyService],
})
export class TacticalTaxonomyModule {}
