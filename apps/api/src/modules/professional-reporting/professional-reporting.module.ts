import { Module } from "@nestjs/common";
import { ProfessionalReportingController } from "./professional-reporting.controller";
import { ProfessionalReportingService } from "./professional-reporting.service";

@Module({
  controllers: [ProfessionalReportingController],
  providers: [ProfessionalReportingService],
})
export class ProfessionalReportingModule {}
