import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';

export class SearchProductDto extends PaginationQueryDto {
  @ApiProperty({ description: '브랜드+제품명 검색어' })
  @IsString()
  @Length(1, 100)
  q: string;
}
