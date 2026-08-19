-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'KAKAO', 'GOOGLE', 'APPLE');

-- CreateEnum
CREATE TYPE "ProductSource" AS ENUM ('OFFICIAL', 'USER_OCR', 'USER_MANUAL');

-- CreateEnum
CREATE TYPE "TrialStatus" AS ENUM ('DRAFT', 'RUNNING', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ArmRole" AS ENUM ('TEST', 'CONTROL');

-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LEFT', 'RIGHT');

-- CreateEnum
CREATE TYPE "MeasurementStatus" AS ENUM ('SUCCESS', 'RETAKEN', 'FAILED');

-- CreateEnum
CREATE TYPE "QualityGrade" AS ENUM ('GOOD', 'FAIR', 'POOR');

-- CreateEnum
CREATE TYPE "MetricRegion" AS ENUM ('CHEEK', 'FOREHEAD', 'CHIN', 'NOSE_SIDE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('QUEUED', 'RUNNING', 'DONE', 'FAILED');

-- CreateEnum
CREATE TYPE "Verdict" AS ENUM ('NO_DIFFERENCE', 'SIGNIFICANT', 'INSUFFICIENT_DATA');

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" TEXT,
    "password_hash" TEXT,
    "provider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "provider_uid" TEXT,
    "nickname" TEXT,
    "research_consent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "brand_name" TEXT,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "image_url" TEXT,
    "source" "ProductSource" NOT NULL DEFAULT 'OFFICIAL',
    "created_by_user_id" BIGINT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trials" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "primary_metric_id" INTEGER NOT NULL,
    "status" "TrialStatus" NOT NULL DEFAULT 'DRAFT',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "run_in_days" INTEGER NOT NULL DEFAULT 7,
    "randomization_seed" TEXT NOT NULL,
    "preferred_capture_time" TIME,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "locked_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_arms" (
    "id" BIGSERIAL NOT NULL,
    "trial_id" BIGINT NOT NULL,
    "product_id" BIGINT,
    "role" "ArmRole" NOT NULL,
    "side" "Side" NOT NULL,

    CONSTRAINT "trial_arms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" BIGSERIAL NOT NULL,
    "trial_id" BIGINT NOT NULL,
    "day_index" INTEGER NOT NULL,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "status" "MeasurementStatus" NOT NULL DEFAULT 'SUCCESS',
    "quality_grade" "QualityGrade",
    "env_similarity_prev" DECIMAL(5,2),
    "reject_reason" TEXT,
    "retake_of_id" BIGINT,
    "device_model" TEXT,
    "ambient_lux" DECIMAL(8,2),
    "white_balance_k" INTEGER,
    "exposure_ev" DECIMAL(5,2),
    "face_yaw" DECIMAL(5,2),
    "face_pitch" DECIMAL(5,2),
    "face_roll" DECIMAL(5,2),
    "distance_mm" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "measurement_metrics" (
    "id" BIGSERIAL NOT NULL,
    "measurement_id" BIGINT NOT NULL,
    "metric_id" INTEGER NOT NULL,
    "side" "Side" NOT NULL,
    "region" "MetricRegion" NOT NULL DEFAULT 'CHEEK',
    "lab_l" DECIMAL(7,3),
    "lab_a" DECIMAL(7,3),
    "lab_b" DECIMAL(7,3),
    "value" DECIMAL(9,4) NOT NULL,
    "sample_pixels" INTEGER,

    CONSTRAINT "measurement_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" BIGSERIAL NOT NULL,
    "trial_id" BIGINT NOT NULL,
    "measurement_id" BIGINT NOT NULL,
    "report_date" DATE NOT NULL,
    "left_value" DECIMAL(9,4),
    "right_value" DECIMAL(9,4),
    "gap" DECIMAL(9,4),
    "gap_delta_prev" DECIMAL(9,4),
    "summary_text" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trial_reports" (
    "id" BIGSERIAL NOT NULL,
    "trial_id" BIGINT NOT NULL,
    "model_version" TEXT NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'QUEUED',
    "headline" TEXT,
    "share_token" TEXT,
    "generated_at" TIMESTAMP(3),
    "error_message" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_metric_results" (
    "id" BIGSERIAL NOT NULL,
    "report_id" BIGINT NOT NULL,
    "metric_id" INTEGER NOT NULL,
    "verdict" "Verdict" NOT NULL,
    "baseline_gap" DECIMAL(9,4),
    "effect_mean" DECIMAL(9,4),
    "ci_low" DECIMAL(9,4),
    "ci_high" DECIMAL(9,4),
    "prob_direction" DECIMAL(5,4),
    "n_observations" INTEGER,
    "narrative" TEXT,

    CONSTRAINT "report_metric_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_provider_provider_uid_key" ON "users"("provider", "provider_uid");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_code_key" ON "metrics"("code");

-- CreateIndex
CREATE INDEX "idx_trials_user" ON "trials"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trial_arms_trial_id_role_key" ON "trial_arms"("trial_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "trial_arms_trial_id_side_key" ON "trial_arms"("trial_id", "side");

-- CreateIndex
CREATE INDEX "idx_measure_trial_time" ON "measurements"("trial_id", "captured_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "measurement_metrics_measurement_id_metric_id_side_region_key" ON "measurement_metrics"("measurement_id", "metric_id", "side", "region");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_measurement_id_key" ON "daily_reports"("measurement_id");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reports_trial_id_report_date_key" ON "daily_reports"("trial_id", "report_date");

-- CreateIndex
CREATE UNIQUE INDEX "trial_reports_trial_id_key" ON "trial_reports"("trial_id");

-- CreateIndex
CREATE UNIQUE INDEX "trial_reports_share_token_key" ON "trial_reports"("share_token");

-- CreateIndex
CREATE UNIQUE INDEX "report_metric_results_report_id_metric_id_key" ON "report_metric_results"("report_id", "metric_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trials" ADD CONSTRAINT "trials_primary_metric_id_fkey" FOREIGN KEY ("primary_metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_arms" ADD CONSTRAINT "trial_arms_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_arms" ADD CONSTRAINT "trial_arms_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_retake_of_id_fkey" FOREIGN KEY ("retake_of_id") REFERENCES "measurements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_metrics" ADD CONSTRAINT "measurement_metrics_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurement_metrics" ADD CONSTRAINT "measurement_metrics_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_measurement_id_fkey" FOREIGN KEY ("measurement_id") REFERENCES "measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trial_reports" ADD CONSTRAINT "trial_reports_trial_id_fkey" FOREIGN KEY ("trial_id") REFERENCES "trials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_metric_results" ADD CONSTRAINT "report_metric_results_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "trial_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_metric_results" ADD CONSTRAINT "report_metric_results_metric_id_fkey" FOREIGN KEY ("metric_id") REFERENCES "metrics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================
-- Hand-written additions: not expressible in schema.prisma
-- (business-rule CHECK constraints, partial unique indexes,
-- trigram search index). Keep in sync with mvp_schema.sql.
-- ============================================================

-- Product free-text search (brand + name)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX "idx_products_search" ON "products" USING gin ((coalesce("brand_name", '') || ' ' || "name") gin_trgm_ops);

-- Trial must run at least 4 weeks
ALTER TABLE "trials" ADD CONSTRAINT "trials_end_date_check" CHECK ("end_date" >= "start_date" + 28);

-- Only one RUNNING trial per user (MVP policy)
CREATE UNIQUE INDEX "uq_running_trial" ON "trials"("user_id") WHERE "status" = 'RUNNING';

-- Only one SUCCESS measurement per trial per day
CREATE UNIQUE INDEX "uq_measure_per_day" ON "measurements"("trial_id", "day_index") WHERE "status" = 'SUCCESS';

-- Confidence interval sanity check
ALTER TABLE "report_metric_results" ADD CONSTRAINT "report_metric_results_ci_check" CHECK ("ci_low" IS NULL OR "ci_high" IS NULL OR "ci_low" <= "ci_high");

-- Seed metrics master data (MVP beta: only REDNESS is active)
INSERT INTO "metrics" ("code", "name", "unit", "is_active") VALUES
    ('REDNESS', '홍조(붉은기)', 'a*', true),
    ('BRIGHTNESS', '미백', 'L*', false),
    ('WRINKLE', '주름', 'score', false);
