import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
} from 'class-validator';

export class CreateTrialDto {
  @ApiProperty()
  @IsString()
  @Length(1, 200)
  title: string;

  @ApiProperty({ description: '주요 측정 항목 id' })
  @IsInt()
  primaryMetricId: number;

  @ApiProperty({ example: '2026-09-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-09-29', description: '최소 startDate + 28일' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ default: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  runInDays?: number;

  @ApiPropertyOptional({ example: '21:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'preferredCaptureTime must be HH:mm',
  })
  preferredCaptureTime?: string;

  @ApiPropertyOptional({ default: 'Asia/Seoul' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: '테스트(시험) 제품 id' })
  @IsOptional()
  @IsNumberString()
  testProductId?: string;

  @ApiPropertyOptional({ description: '대조 제품 id' })
  @IsOptional()
  @IsNumberString()
  controlProductId?: string;
}
