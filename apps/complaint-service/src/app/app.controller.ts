import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('complaints')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return { status: 'OK', service: 'complaint-service' };
  }

  @Post()
  createComplaint(@Body() data: any) {
    return this.appService.createComplaint(data);
  }

  @Post('trigger-escalation-check')
  async triggerEscalationCheck() {
    await this.appService.autoEscalateComplaints();
    return { success: true, message: 'Auto-escalation check executed.' };
  }

  @Get('dashboard')
  getDashboard(
    @Query('role') role: string,
    @Query('userId') userId: string,
    @Query('wardNumber') wardNumber?: string
  ) {
    const ward = wardNumber ? parseInt(wardNumber, 10) : undefined;
    return this.appService.getDashboardData(role, userId, ward);
  }

  @Get(':id')
  getComplaint(@Param('id') id: string) {
    return this.appService.getComplaint(id);
  }

  @Post(':id/assign')
  assignComplaint(@Param('id') id: string, @Body() data: any) {
    return this.appService.assignTask(id, data);
  }

  @Post(':id/investigate')
  investigateComplaint(@Param('id') id: string, @Body() data: any) {
    return this.appService.investigateSite(id, data);
  }

  @Post(':id/legal-action')
  updateLegalAction(@Param('id') id: string, @Body() data: any) {
    return this.appService.updateLegalAction(id, data);
  }

  @Post(':id/resolve')
  resolveComplaint(@Param('id') id: string, @Body() data: any) {
    return this.appService.resolveComplaint(id, data);
  }

  @Post(':id/severity')
  updateSeverity(@Param('id') id: string, @Body() data: any) {
    return this.appService.updateSeverity(id, data);
  }

  @Post(':id/escalate')
  manualEscalate(@Param('id') id: string) {
    return this.appService.manualEscalate(id);
  }
}
