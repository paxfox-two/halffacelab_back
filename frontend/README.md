# 하프페이스랩 프론트엔드 (MVP)

좌우 얼굴 반반 비교 홍조 분석 서비스의 모바일 웹 프론트엔드. React + TypeScript + Vite.

핵심 흐름: 홈 → 제품 등록(테스트 설계) → 오늘 피부 측정 → 풀스크린 얼굴 촬영 → 홍조 분석 결과 → 일일/최종 리포트.
백엔드는 `../backend`를 참고 (NestJS + Prisma + PostgreSQL).

## 스택

- **런타임**: React 19, TypeScript, Vite
- **라우팅**: `react-router-dom` (클라이언트 사이드, 별도 상태 관리 라이브러리 없음 — 화면 간 공유 상태는 `context/`의 React Context로 충분)
- **스타일**: 별도 UI 프레임워크 없음. Figma 디자인 시스템(색상/타이포/버튼/인풋/태그)을 `styles/tokens.css`의 CSS 커스텀 프로퍼티로 옮기고, 화면·컴포넌트별 CSS Modules로 조합
- **얼굴 인식**: `@mediapipe/tasks-vision`의 FaceLandmarker — 브라우저에서 완전히 로컬로 동작(WASM은 `public/mediapipe/wasm`에서 직접 서빙, 모델 파일만 최초 1회 Google 공식 CDN에서 받아옴)

## 로컬 실행

```sh
npm install        # postinstall이 @mediapipe/tasks-vision의 WASM을 public/mediapipe/wasm으로 복사
npm run dev
```

백엔드(`../backend`)가 `http://localhost:3000`에서 먼저 떠 있어야 합니다 — `vite.config.ts`의 `server.proxy`가 `/api`를 그쪽으로 넘겨줍니다. 백엔드 실행 방법은 `../backend/README.md` 참고.

카메라 화면을 테스트하려면 실제 기기/브라우저의 카메라 권한이 필요합니다. `getUserMedia`는 `localhost`거나 HTTPS여야 동작합니다.

## 로그인 없음 (게스트 인증)

이 MVP는 로그인 화면이 없습니다. `lib/auth.ts`가 최초 로드 시 무작위 이메일/비밀번호로 게스트 계정을 만들고 토큰을 `localStorage`에 저장 — 이후에는 그 토큰을 재사용하고, 만료되면 저장해둔 자격증명으로 재로그인합니다. 백엔드의 JWT 인증 자체는 그대로 두고, 프론트엔드에서만 로그인 UI를 생략한 것입니다.

## 홍조 분석이 실제로 동작하는 방식

`lib/faceAnalysis.ts`가 촬영 화면(`pages/Camera.tsx`)에서 매 프레임 다음을 수행합니다:

1. FaceLandmarker로 얼굴 랜드마크 검출
2. 코 중심선 랜드마크로 얼굴 정중선(midline) 계산 → 정중선 기준 좌/우 볼 영역을 사각형으로 정의
3. 촬영 시점에 그 영역의 실제 캔버스 픽셀을 읽어 평균 sRGB 계산
4. `lib/color.ts`의 표준 sRGB → CIE Lab 변환으로 L\*/a\*/b\* 산출 (REDNESS 지표 단위가 `a*`)
5. 좌/우 각각의 `{side, value, labL, labA, labB, samplePixels}`를 백엔드 `POST /trials/:id/measurements`에 그대로 전송

고정값이나 `Math.random()`은 어디에도 없습니다 — 사진이 다르면 결과도 실제로 달라집니다. 실시간 촬영 가이드(조명/정면/거리 태그, 얼굴 가이드 원 안의 좌우 영역 오버레이)도 같은 분석 결과를 그대로 화면에 그린 것이라, 사용자가 보는 것과 실제로 측정되는 영역이 항상 일치합니다.

## 폴더 구조

```
src/
  components/   재사용 UI (Button, TextInput, Tag, NavBar, TrendChart, LogoMark, Icon 등)
  context/      TrialContext(현재 진행 중인 테스트), SetupContext(제품 등록 폼 상태)
  lib/          api 클라이언트, 게스트 인증, 얼굴 분석, 색상 변환, 날짜 포맷, 타입, 튜토리얼 콘텐츠
  pages/        라우트별 화면 (App.tsx에서 매핑)
  styles/       디자인 토큰(tokens.css), 전역 리셋(global.css)
```

## 범위에서 제외한 것

- 로그인 UI (위 참고), 결제, 고급 개인정보 기능
- 제품 등록의 "촬영하기" 버튼은 사진만 첨부하고 저장 — 실제 OCR(제품명 자동 인식)은 구현하지 않았고, 화면에도 그렇게 안내함. 제품명은 항상 직접 입력하거나 검색으로 채워야 함
- MVP에서는 홍조(REDNESS)만 실제로 분석. 백엔드에 미백/잡티 지표가 비활성 상태로 남아있어, 화면에도 그 두 항목은 비활성 탭/빈 값으로만 표시(가짜 수치를 만들어 채우지 않음)

## 디자인 소스

`../design/`에 Figma에서 내보낸 실제 SVG들이 있습니다(로고, 컬러/타이포/버튼/태그 등 디자인 시스템, 화면별 목업). 이 디렉터리는 참고용이라 git에는 커밋하지 않음(`../design`는 추적 대상 아님, 약 28MB) — 화면을 다시 다듬을 때 여기서 직접 렌더링해서 비교하면 됩니다.
