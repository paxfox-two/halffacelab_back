import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, Length } from 'class-validator';

const CATEGORIES = [
  'TONER',
  'CREAM',
  'SERUM',
  'SUNSCREEN',
  'CLEANSER',
  'ETC',
] as const;

export class CreateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  brandName?: string;

  @ApiProperty()
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiPropertyOptional({ enum: CATEGORIES })
  @IsOptional()
  @IsIn(CATEGORIES)
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
