import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { isUniqueConstraintError } from '../common/prisma/prisma.utils';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          nickname: dto.nickname,
          provider: 'LOCAL',
        },
        select: { id: true, email: true, nickname: true, createdAt: true },
      });
      return this.issueToken(user.id, user.email);
    } catch (error) {
      if (isUniqueConstraintError(error, 'email')) {
        throw new ConflictException('이미 가입된 이메일입니다.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user?.passwordHash) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      );
    }
    return this.issueToken(user.id, user.email);
  }

  private issueToken(userId: bigint, email: string | null) {
    const accessToken = this.jwt.sign({
      sub: userId.toString(),
      email,
    });
    return { accessToken };
  }
}
