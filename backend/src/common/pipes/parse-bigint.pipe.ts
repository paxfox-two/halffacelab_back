import { BadRequestException, PipeTransform } from '@nestjs/common';

export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  transform(value: string): bigint {
    if (!/^\d+$/.test(value)) {
      throw new BadRequestException('올바르지 않은 id 형식입니다.');
    }
    return BigInt(value);
  }
}
