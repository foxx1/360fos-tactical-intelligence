import { Controller, Get, Param, Query } from "@nestjs/common";
import { TacticalTaxonomyService } from "./tactical-taxonomy.service";

@Controller("tactical-taxonomy")
export class TacticalTaxonomyController {
  constructor(private readonly service: TacticalTaxonomyService) {}

  @Get()
  async getTree() {
    return { success: true, data: await this.service.getTree() };
  }

  @Get("phases")
  async getPhases() {
    return { success: true, data: await this.service.getPhases() };
  }

  @Get("principles")
  async getPrinciples(@Query("phase") phase?: string) {
    return { success: true, data: await this.service.getPrinciples(phase) };
  }

  @Get("principles/:id/sub-principles")
  async getSubPrinciples(@Param("id") id: string) {
    return { success: true, data: await this.service.getSubPrinciples(id) };
  }

  @Get("sub-principles/:id/behaviours")
  async getBehaviours(@Param("id") id: string) {
    return { success: true, data: await this.service.getBehaviours(id) };
  }
}
