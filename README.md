# 하프페이스랩 (Half Face Lab) — MVP

좌우 얼굴을 반반 나눠 제품 효과를 비교하는 홍조 분석 서비스의 모바일 웹 MVP.

핵심 흐름: **제품 등록(테스트 설계) → 홈 → 오늘 피부 측정 → 풀스크린 얼굴 촬영 → 홍조 분석 결과 → 일일/최종 리포트**. 로그인 화면 없이(게스트 인증), 촬영한 사진에서 얼굴 좌/우 볼 영역을 실제로 나눠 RGB→Lab 기반으로 홍조(a\*) 값을 계산한다 — 고정값·랜덤값 없이 사진마다 실제로 다른 결과가 나온다.

## 구성

```
backend/    NestJS + Prisma + PostgreSQL — API 서버
frontend/   React + Vite — 모바일 웹 클라이언트
design/     Figma에서 내보낸 SVG 원본 (참고용, git 미추적, ~28MB)
```

각각의 상세 내용은 `backend/README.md`, `frontend/README.md` 참고. 이 문서는 두 프로젝트를 함께 띄우는 방법과 전체 그림만 다룬다.

## 로컬에서 함께 실행하기

1. **DB**: Docker가 있으면 저장소 루트에서 `docker compose up -d`. 없으면 `backend/.devdb/README.md`에 정리된 루트리스 로컬 PostgreSQL 사용.
2. **백엔드** (`backend/`):
   ```sh
   cp .env.example .env   # DATABASE_URL, JWT_SECRET 등
   npm install
   npx prisma migrate deploy
   npm run start:dev      # http://localhost:3000, /api/v1/health로 확인
   ```
3. **프론트엔드** (`frontend/`):
   ```sh
   npm install             # postinstall이 MediaPipe WASM을 public/으로 복사
   npm run dev              # http://localhost:5173, /api를 백엔드로 프록시
   ```
4. 브라우저로 `http://localhost:5173` 접속. 로그인 화면은 없음 — 첫 로드 시 게스트 계정이 자동으로 만들어진다. 카메라 화면은 `getUserMedia` 특성상 `localhost` 또는 HTTPS에서만 동작한다.

## 이 MVP가 실제로 하는 일

- **홍조 분석은 진짜다**: 서버에 고정값·랜덤값을 두지 않는다. 브라우저에서 MediaPipe FaceLandmarker로 얼굴 랜드마크를 찾고, 정중선 기준 좌/우 볼 영역의 실제 픽셀을 sRGB→CIE Lab으로 변환해 a\* 값을 계산한 뒤 서버로 보낸다 (`frontend/src/lib/faceAnalysis.ts`).
- **리포트 통계도 진짜다**: 매 측정마다 그날의 좌/우 평균·격차(gap)를 자동으로 일일 리포트에 반영하고, 최종 리포트 생성 시 좌우 격차 시계열에 대한 paired-difference 통계(평균, 95% 신뢰구간, 방향 일관성, 유의성 판정)를 실제로 계산한다 (`backend/src/reports/reports.service.ts`). 핵심 결과와 그래프를 먼저 보여주고, 전문 통계 수치는 "상세 통계 보기" 토글 뒤에 둔다.
- **디자인은 Figma를 그대로 따른다**: 색상/타이포/컴포넌트는 `design/`의 실제 내보내기 SVG와 Figma MCP로 읽은 값을 그대로 옮겼다.

## 범위에서 뺀 것 (의도적)

- 로그인 화면, 결제, 고급 개인정보 기능
- 제품 사진으로 이름을 자동 인식하는 OCR — 사진은 첨부만 되고, 이름은 항상 직접 입력하거나 검색해서 채운다 (화면에도 그렇게 안내)
- 미백(BRIGHTNESS)·잡티 지표 — 백엔드에 비활성 상태로 남아있고, 화면에도 비활성 탭으로만 표시. 가짜 수치로 채우지 않는다

## 배포

`docker compose up -d --build` 한 번으로 postgres + backend + (프론트엔드를 서빙하며 `/api`를 리버스 프록시하고 자동 HTTPS까지 처리하는) caddy가 뜬다 — GCP든 Gabia든 Docker 되는 VM이면 동일하게 동작한다. 임시로 GCP에 올렸다가 나중에 Gabia로 옮기는 절차는 **`DEPLOY.md`** 참고.

## 문서

- `backend/README.md` — API, 스키마, 비즈니스 규칙, 확장성 메모
- `frontend/README.md` — 프론트 스택, 폴더 구조, 얼굴 분석 파이프라인 상세
- `DEPLOY.md` — GCP 임시 배포 → Gabia 이전 절차
- `halffacelab-api-endpoints.csv`, `mvp_erd.mermaid`, `mvp_schema.sql` — 초기 설계 참고 문서
