# 하프페이스랩 백엔드 (MVP)

좌우 얼굴 N-of-1 임상 비교 서비스의 백엔드. NestJS + Prisma + PostgreSQL.

## 스택

- **런타임**: Node.js 20, TypeScript, NestJS 11
- **DB**: PostgreSQL 15+, Prisma 6 (스키마 소스 오브 트루스: `prisma/schema.prisma`)
- **인증**: JWT (bcrypt 해시), `@nestjs/passport`
- **문서**: Swagger — `/docs`
- **로깅**: `nestjs-pino` (구조화 로그)
- **헬스체크**: `@nestjs/terminus` — `GET /api/v1/health` (DB ping 포함)

## 로컬 실행

```sh
cp .env.example .env   # DATABASE_URL, JWT_SECRET 등 설정
npm install
npx prisma migrate deploy   # 또는 개발 중 스키마 변경 시 prisma migrate dev
npm run start:dev
```

DB가 필요합니다. Docker가 있는 환경이라면 저장소 루트의 `docker-compose.yml`을 사용하세요:

```sh
docker compose up -d
```

Docker가 없는 샌드박스(이 환경 포함)에서는 `.devdb/README.md`에 문서화된 루트리스 로컬 PostgreSQL을 사용했습니다.

## 스키마 변경 워크플로

`prisma/schema.prisma`가 canonical source입니다. 스키마를 바꿀 때:

```sh
npx prisma migrate dev --name <설명>
```

`WHERE` 조건이 붙는 부분 유니크 인덱스(`uq_running_trial`, `uq_measure_per_day`)와 `CHECK` 제약, `pg_trgm` 검색 인덱스는 Prisma 스키마 문법으로 표현할 수 없어 `prisma/migrations/20260819035837_init/migration.sql` 하단에 수기로 추가되어 있습니다. 새 마이그레이션에서 이 테이블들을 건드릴 경우 해당 제약이 유지되는지 확인하세요.

`mvp_schema.sql` / `mvp_erd.mermaid` (저장소 루트)는 참고용 문서이며 스키마 변경 시 함께 업데이트해야 합니다.

## API 개요

전체 스펙은 `/docs` (Swagger). 인증이 필요한 리소스는 `Authorization: Bearer <token>`.

| 리소스 | 엔드포인트 |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Users | `GET/PATCH /users/me` |
| Products | `GET/POST /products`, `GET /products/search?q=`, `GET/PATCH /products/:id` |
| Metrics | `GET /metrics` (읽기전용) |
| Trials | `POST/GET /trials`, `GET/PATCH /trials/:id`, `POST /trials/:id/lock` |
| Measurements | `POST/GET /trials/:trialId/measurements` |
| Reports | `GET /trials/:trialId/daily-reports`, `GET /trials/:trialId/report`, `POST /trials/:trialId/report/generate`, `GET /reports/shared/:token` (공개) |

모든 경로는 `/api/v1` 프리픽스가 붙습니다.

### 비즈니스 규칙 (DB 제약 + 서비스 레이어 이중 검증)

- 임상 기간은 최소 4주 (`endDate >= startDate + 28`)
- 사용자당 동시 진행(RUNNING) 임상은 1개
- 임상당 하루 1건의 유효 측정만 허용
- 좌우(LEFT/RIGHT) 배정은 서버가 무작위로 결정하고 시드를 기록 (클라이언트가 선택 불가)

## 테스트

```sh
npm run test:e2e   # 회원가입 -> 임상생성 -> RUNNING전환 -> 측정제출 -> 리포트요청 스모크 플로우
npm run test        # 유닛 테스트 (현재 없음, --passWithNoTests)
```

## 확장성 메모

- **무상태**: JWT만 사용, 서버 세션 없음 — 컨테이너를 몇 개든 띄워 로드밸런서 뒤에 둘 수 있음
- **커넥션 풀**: Prisma가 인스턴스별로 풀을 관리. 여러 레플리카를 띄우는 배포에서는 PgBouncer(트랜잭션 풀링)를 Postgres 앞단에 두어 인스턴스별 풀이 DB 커넥션 한도를 합쳐서 소진하지 않도록 할 것
- **리포트 분석**: `POST /trials/:id/report/generate`는 현재 paired-difference(평균±95% CI) 통계를 요청 스레드에서 동기 계산해 `status=DONE`까지 바로 응답한다(MVP 범위, 계산량이 가벼움). 더 무거운 모델(베이지안 N-of-1 등)로 바꿀 경우 `trial_reports.status=QUEUED`만 쓰고 즉시 응답한 뒤 별도 워커(BullMQ+Redis 등)가 처리하도록 다시 분리할 것 — 스키마는 이미 그 분리를 염두에 두고 설계되어 있음
- **페이지네이션**: 모든 목록 API가 `limit/offset` 지원. `measurements`처럼 행이 많이 쌓이는 리소스는 추후 커서 기반(keyset) 페이지네이션으로 전환 고려
- **검색**: `products.search`는 `pg_trgm` GIN 인덱스를 타는 raw SQL 사용. 트래픽이 커지면 Redis 캐시 또는 읽기 복제본으로 분리 가능하도록 서비스 레이어에 격리되어 있음
- **레이트리밋**: `@nestjs/throttler` 전역 100req/min, 로그인은 5req/min으로 별도 제한
- **헬스체크**: `/api/v1/health`가 DB 연결을 확인 — 로드밸런서/오케스트레이터의 readiness probe로 사용
