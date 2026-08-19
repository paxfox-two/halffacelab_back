import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nickname?: string;

  @ApiPropertyOptional({
    description: '연구 목적 익명 데이터 활용 동의',
  })
  @IsOptional()
  @IsBoolean()
  researchConsent?: boolean;
}
