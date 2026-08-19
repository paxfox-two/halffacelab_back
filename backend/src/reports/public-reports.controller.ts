import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports/shared')
export class PublicReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':token')
  getShared(@Param('token') token: string) {
    return this.reportsService.getSharedReport(token);
  }
}
