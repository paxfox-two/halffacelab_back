import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

const SIDES = ['LEFT', 'RIGHT'] as const;
const REGIONS = ['CHEEK', 'FOREHEAD', 'CHIN', 'NOSE_SIDE'] as const;
const STATUSES = ['SUCCESS', 'RETAKEN', 'FAILED'] as const;
const QUALITY_GRADES = ['GOOD', 'FAIR', 'POOR'] as const;

export class MetricValueDto {
  @ApiProperty()
  @IsInt()
  metricId: number;

  @ApiProperty({ enum: SIDES })
  @IsIn(SIDES)
  side: (typeof SIDES)[number];

  @ApiPropertyOptional({ enum: REGIONS, default: 'CHEEK' })
  @IsOptional()
  @IsIn(REGIONS)
  region?: (typeof REGIONS)[number];

  @ApiProperty({ description: '지표 스코어' })
  @IsNumber()
  value: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  labL?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  labA?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  labB?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  samplePixels?: number;
}

export class CreateMeasurementDto {
  @ApiProperty({ description: '임상 N일차' })
  @IsInt()
  @Min(0)
  dayIndex: number;

  @ApiProperty()
  @IsDateString()
  capturedAt: string;

  @ApiPropertyOptional({ enum: STATUSES, default: 'SUCCESS' })
  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @ApiPropertyOptional({ enum: QUALITY_GRADES })
  @IsOptional()
  @IsIn(QUALITY_GRADES)
  qualityGrade?: (typeof QUALITY_GRADES)[number];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  ambientLux?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  whiteBalanceK?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  exposureEv?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  faceYaw?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  facePitch?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  faceRoll?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  distanceMm?: number;

  @ApiProperty({ type: [MetricValueDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MetricValueDto)
  metrics: MetricValueDto[];
}
