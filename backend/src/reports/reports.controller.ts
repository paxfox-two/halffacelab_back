import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trials/:trialId')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-reports')
  listDailyReports(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trialId', ParseBigIntPipe) trialId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reportsService.listDailyReports(user.id, trialId, query);
  }

  @Get('report')
  getTrialReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trialId', ParseBigIntPipe) trialId: bigint,
  ) {
    return this.reportsService.getTrialReport(user.id, trialId);
  }

  @Post('report/generate')
  requestAnalysis(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trialId', ParseBigIntPipe) trialId: bigint,
  ) {
    return this.reportsService.requestAnalysis(user.id, trialId);
  }
}
