import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';

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

  // Accepts either a real URL or a data: URI (client photo capture has no
  // object storage to upload to in this MVP, so it sends the image inline).
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/|data:image\/)/, {
    message: 'imageUrl must be an http(s) URL or a data:image/... URI',
  })
  @Length(1, 2_000_000)
  imageUrl?: string;
}
