import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';

const UPDATABLE_STATUSES = ['RUNNING', 'COMPLETED', 'ABANDONED'] as const;

export class UpdateTrialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 200)
  title?: string;

  @ApiPropertyOptional({ enum: UPDATABLE_STATUSES })
  @IsOptional()
  @IsIn(UPDATABLE_STATUSES)
  status?: (typeof UPDATABLE_STATUSES)[number];
}
