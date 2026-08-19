import { Module } from '@nestjs/common';
import { TrialsModule } from '../trials/trials.module';
import { ReportsController } from './reports.controller';
import { PublicReportsController } from './public-reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [TrialsModule],
  controllers: [ReportsController, PublicReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
