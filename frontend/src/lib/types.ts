export type Side = 'LEFT' | 'RIGHT';
export type ArmRole = 'TEST' | 'CONTROL';
export type TrialStatus = 'DRAFT' | 'RUNNING' | 'COMPLETED' | 'ABANDONED';
export type MetricRegion = 'CHEEK' | 'FOREHEAD' | 'CHIN' | 'NOSE_SIDE';
export type QualityGrade = 'GOOD' | 'FAIR' | 'POOR';
export type ReportStatus = 'QUEUED' | 'RUNNING' | 'DONE' | 'FAILED';
export type Verdict = 'NO_DIFFERENCE' | 'SIGNIFICANT' | 'INSUFFICIENT_DATA';

export type Product = {
  id: string;
  brandName: string | null;
  name: string;
  category: string | null;
  imageUrl: string | null;
};

export type Metric = {
  id: number;
  code: string;
  name: string;
  unit: string | null;
  isActive: boolean;
};

export type TrialArm = {
  id: string;
  trialId: string;
  productId: string | null;
  role: ArmRole;
  side: Side;
  product?: Product;
};

export type Trial = {
  id: string;
  userId: string;
  title: string;
  primaryMetricId: number;
  status: TrialStatus;
  startDate: string;
  endDate: string;
  runInDays: number;
  lockedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  arms: TrialArm[];
  primaryMetric?: Metric;
};

export type MetricValueInput = {
  metricId: number;
  side: Side;
  region?: MetricRegion;
  value: number;
  labL?: number;
  labA?: number;
  labB?: number;
  samplePixels?: number;
};

export type MeasurementMetricValue = MetricValueInput & { id: string; measurementId: string };

export type Measurement = {
  id: string;
  trialId: string;
  dayIndex: number;
  capturedAt: string;
  status: 'SUCCESS' | 'RETAKEN' | 'FAILED';
  qualityGrade: QualityGrade | null;
  envSimilarityPrev: string | null;
  faceYaw: string | null;
  facePitch: string | null;
  distanceMm: number | null;
  createdAt: string;
  metricValues: MeasurementMetricValue[];
};

export type DailyReport = {
  id: string;
  trialId: string;
  measurementId: string;
  reportDate: string;
  leftValue: string | null;
  rightValue: string | null;
  gap: string | null;
  gapDeltaPrev: string | null;
  summaryText: string | null;
  generatedAt: string;
};

export type ReportMetricResult = {
  id: string;
  reportId: string;
  metricId: number;
  verdict: Verdict;
  baselineGap: string | null;
  effectMean: string | null;
  ciLow: string | null;
  ciHigh: string | null;
  probDirection: string | null;
  nObservations: number | null;
  narrative: string | null;
};

export type TrialReport = {
  id: string;
  trialId: string;
  modelVersion: string;
  status: ReportStatus;
  headline: string | null;
  generatedAt: string | null;
  results: ReportMetricResult[];
};

export type Paginated<T> = { items: T[]; total: number; limit: number; offset: number };
