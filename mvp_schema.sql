-- =====================================================================
-- 하프페이스랩 MVP 스키마 (10 tables)
-- PostgreSQL 15+
-- 범위: 제품 / 임상 / 마스터 / 측정 / 분석 / 리포트
-- 제외: 구독·결제, 동의 이력, 알림, 성분, 튜토리얼, 문의, RWE
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ---------- 계정 (임상 소유자 앵커 · 최소 구성) ----------
CREATE TABLE users (
    id               BIGSERIAL PRIMARY KEY,
    email            VARCHAR(255) UNIQUE,
    password_hash    VARCHAR(255),
    provider         VARCHAR(10) NOT NULL DEFAULT 'LOCAL'
                     CHECK (provider IN ('LOCAL','KAKAO','GOOGLE','APPLE')),
    provider_uid     VARCHAR(191),
    nickname         VARCHAR(50),
    research_consent BOOLEAN NOT NULL DEFAULT FALSE,  -- 연구 목적 익명 활용(선택 동의)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_uid)
);

-- ---------- 마스터 ----------
CREATE TABLE metrics (
    id        SERIAL PRIMARY KEY,
    code      VARCHAR(30) NOT NULL UNIQUE,
    name      VARCHAR(50) NOT NULL,
    unit      VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT FALSE   -- MVP(베타)는 REDNESS만 TRUE
);

INSERT INTO metrics (code, name, unit, is_active) VALUES
    ('REDNESS',    '홍조(붉은기)', 'a*',    TRUE),
    ('BRIGHTNESS', '미백',        'L*',    FALSE),
    ('WRINKLE',    '주름',        'score', FALSE);

-- ---------- 제품 ----------
CREATE TABLE products (
    id                 BIGSERIAL PRIMARY KEY,
    brand_name         VARCHAR(100),
    name               VARCHAR(200) NOT NULL,
    category           VARCHAR(40),
    image_url          VARCHAR(500),
    source             VARCHAR(20) NOT NULL DEFAULT 'OFFICIAL'
                       CHECK (source IN ('OFFICIAL','USER_OCR','USER_MANUAL')),
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_verified        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 제품 검색 (상단 CREATE EXTENSION pg_trgm 적용됨)
CREATE INDEX idx_products_search ON products USING gin ((brand_name || ' ' || name) gin_trgm_ops);

-- ---------- 임상 ----------
CREATE TABLE trials (
    id                     BIGSERIAL PRIMARY KEY,
    user_id                BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title                  VARCHAR(200) NOT NULL,
    primary_metric_id      INT NOT NULL REFERENCES metrics(id),
    status                 VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                           CHECK (status IN ('DRAFT','RUNNING','COMPLETED','ABANDONED')),
    start_date             DATE NOT NULL,
    end_date               DATE NOT NULL,
    run_in_days            INT NOT NULL DEFAULT 7,   -- 기저 좌우 격차 측정 구간
    randomization_seed     VARCHAR(64) NOT NULL,     -- 좌우 무작위 배정 재현용
    preferred_capture_time TIME,
    timezone               VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    locked_at              TIMESTAMPTZ,              -- 첫 측정 시 설계 잠금
    completed_at           TIMESTAMPTZ,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (end_date >= start_date + 28)              -- 최소 4주
);
-- 동시에 진행 중인 임상은 1개 (MVP 정책)
CREATE UNIQUE INDEX uq_running_trial ON trials(user_id) WHERE status = 'RUNNING';
-- 사용자별 임상 목록 조회 (마이페이지)
CREATE INDEX idx_trials_user ON trials(user_id, created_at DESC);

-- 좌우 배정: MVP는 교차 없이 임상 내내 고정
CREATE TABLE trial_arms (
    id         BIGSERIAL PRIMARY KEY,
    trial_id   BIGINT NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    product_id BIGINT REFERENCES products(id),
    role       VARCHAR(10) NOT NULL CHECK (role IN ('TEST','CONTROL')),
    side       VARCHAR(5)  NOT NULL CHECK (side IN ('LEFT','RIGHT')),
    UNIQUE (trial_id, role),
    UNIQUE (trial_id, side)
);

-- ---------- 측정 ----------
CREATE TABLE measurements (
    id                  BIGSERIAL PRIMARY KEY,
    trial_id            BIGINT NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    day_index           INT NOT NULL,
    captured_at         TIMESTAMPTZ NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'SUCCESS'
                        CHECK (status IN ('SUCCESS','RETAKEN','FAILED')),
    quality_grade       VARCHAR(10) CHECK (quality_grade IN ('GOOD','FAIR','POOR')),
    env_similarity_prev NUMERIC(5,2),      -- 전날 대비 환경 유사도(%)
    reject_reason       VARCHAR(30),       -- SHADOW, ANGLE, DISTANCE, LOW_LIGHT
    retake_of_id        BIGINT REFERENCES measurements(id) ON DELETE SET NULL,
    -- 촬영 환경 (원 설계의 capture_environments 1:1 병합)
    device_model        VARCHAR(100),
    ambient_lux         NUMERIC(8,2),
    white_balance_k     INT,
    exposure_ev         NUMERIC(5,2),
    face_yaw            NUMERIC(5,2),
    face_pitch          NUMERIC(5,2),
    face_roll           NUMERIC(5,2),
    distance_mm         INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- 하루 1건의 유효 측정만 인정
CREATE UNIQUE INDEX uq_measure_per_day ON measurements(trial_id, day_index)
    WHERE status = 'SUCCESS';
CREATE INDEX idx_measure_trial_time ON measurements(trial_id, captured_at DESC);

-- 서버에 저장되는 실질 데이터: 익명화된 수치 벡터 (원본 이미지 미전송)
CREATE TABLE measurement_metrics (
    id             BIGSERIAL PRIMARY KEY,
    measurement_id BIGINT NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
    metric_id      INT NOT NULL REFERENCES metrics(id),
    side           VARCHAR(5) NOT NULL CHECK (side IN ('LEFT','RIGHT')),
    region         VARCHAR(20) NOT NULL DEFAULT 'CHEEK'
                   CHECK (region IN ('CHEEK','FOREHEAD','CHIN','NOSE_SIDE')),
    lab_l          NUMERIC(7,3),
    lab_a          NUMERIC(7,3),
    lab_b          NUMERIC(7,3),
    value          NUMERIC(9,4) NOT NULL,
    sample_pixels  INT,
    UNIQUE (measurement_id, metric_id, side, region)
);

-- ---------- 분석 / 리포트 ----------
CREATE TABLE daily_reports (
    id             BIGSERIAL PRIMARY KEY,
    trial_id       BIGINT NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
    measurement_id BIGINT NOT NULL UNIQUE REFERENCES measurements(id) ON DELETE CASCADE,
    report_date    DATE NOT NULL,
    left_value     NUMERIC(9,4),
    right_value    NUMERIC(9,4),
    gap            NUMERIC(9,4),      -- 좌 - 우
    gap_delta_prev NUMERIC(9,4),      -- 전일 대비 격차 변화
    summary_text   TEXT,              -- 추이 서술만. 효과 판정 문구 금지
    generated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (trial_id, report_date)
);

CREATE TABLE trial_reports (
    id            BIGSERIAL PRIMARY KEY,
    trial_id      BIGINT NOT NULL UNIQUE REFERENCES trials(id) ON DELETE CASCADE,
    model_version VARCHAR(50) NOT NULL,     -- 베이지안 N-of-1 모델 버전 (재현성)
    status        VARCHAR(20) NOT NULL DEFAULT 'QUEUED'
                  CHECK (status IN ('QUEUED','RUNNING','DONE','FAILED')),
    headline      VARCHAR(300),
    share_token   VARCHAR(64) UNIQUE,
    generated_at  TIMESTAMPTZ,
    error_message TEXT,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE report_metric_results (
    id             BIGSERIAL PRIMARY KEY,
    report_id      BIGINT NOT NULL REFERENCES trial_reports(id) ON DELETE CASCADE,
    metric_id      INT NOT NULL REFERENCES metrics(id),
    verdict        VARCHAR(20) NOT NULL
                   CHECK (verdict IN ('NO_DIFFERENCE','SIGNIFICANT','INSUFFICIENT_DATA')),
    baseline_gap   NUMERIC(9,4),   -- 런인 구간 개인 기저 좌우 격차
    effect_mean    NUMERIC(9,4),
    ci_low         NUMERIC(9,4),   -- 95% 신용구간
    ci_high        NUMERIC(9,4),
    prob_direction NUMERIC(5,4),
    n_observations INT,
    narrative      TEXT,           -- 사용자용 문장형 설명
    UNIQUE (report_id, metric_id),
    CHECK (ci_low IS NULL OR ci_high IS NULL OR ci_low <= ci_high)
);

-- =====================================================================
-- 참고 쿼리
-- =====================================================================

-- 1) 홈 대시보드: 완료 측정 수 / 평균 측정 주기 / 최근 측정일
-- SELECT count(*) AS done,
--        round(avg(diff), 1) AS avg_interval_days,
--        max(captured_at)::date AS last_measured
-- FROM (
--   SELECT captured_at,
--          EXTRACT(day FROM captured_at - lag(captured_at) OVER (ORDER BY captured_at)) AS diff
--   FROM measurements WHERE trial_id = $1 AND status = 'SUCCESS'
-- ) t;

-- 2) 런인 구간 기저 격차 (분석 입력)
-- SELECT avg(CASE WHEN mm.side='LEFT' THEN mm.value END)
--      - avg(CASE WHEN mm.side='RIGHT' THEN mm.value END) AS baseline_gap
-- FROM measurements m
-- JOIN measurement_metrics mm ON mm.measurement_id = m.id
-- JOIN trials t ON t.id = m.trial_id
-- WHERE m.trial_id = $1 AND m.status='SUCCESS'
--   AND m.day_index <= t.run_in_days
--   AND mm.metric_id = t.primary_metric_id;
