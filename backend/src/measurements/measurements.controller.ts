import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import { PaginationQueryDto } from '../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';

@ApiTags('measurements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trials/:trialId/measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trialId', ParseBigIntPipe) trialId: bigint,
    @Body() dto: CreateMeasurementDto,
  ) {
    return this.measurementsService.create(user.id, trialId, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('trialId', ParseBigIntPipe) trialId: bigint,
    @Query() query: PaginationQueryDto,
  ) {
    return this.measurementsService.findAllForTrial(user.id, trialId, query);
  }
}
