/**
 * Shared domain types. Everything here is plain data so it can be posted
 * between the main thread and the analysis worker (structured clone).
 */

/** A raw cell. `null` means the value is missing (empty, "NA", "?", ...). */
export type Cell = string | null;

export interface Dataset {
  name: string;
  columns: string[];
  rows: Cell[][];
}

export type ColumnKind = 'numeric' | 'binary' | 'categorical' | 'identifier' | 'constant';

export interface ValueCount {
  value: string;
  count: number;
}

export interface ColumnProfile {
  name: string;
  kind: ColumnKind;
  missing: number;
  unique: number;
  /** Most frequent values (at most 12). */
  topValues: ValueCount[];
  min?: number;
  max?: number;
  mean?: number;
}

export type WarningCode =
  'missingValues' | 'constantColumn' | 'identifierColumn' | 'tinyGroup' | 'fewRows' | 'raggedRows';

export interface DataWarning {
  code: WarningCode;
  column?: string;
  /** Numeric detail used by the message (count, percentage, ...). */
  value?: number;
  detail?: string;
}

export interface DatasetSummary {
  name: string;
  rowCount: number;
  columns: string[];
  preview: Cell[][];
  profiles: ColumnProfile[];
  warnings: DataWarning[];
}

/** How to turn a sensitive column into groups. */
export interface SensitiveSpec {
  column: string;
  /**
   * Bin edges for numeric columns. With edges [25, 45] the groups are
   * "< 25", "25–44", "≥ 45". Undefined means use the raw values.
   */
  binEdges?: number[];
  /** True when the column only holds whole numbers (affects bin labels). */
  integer?: boolean;
}

export interface AuditConfig {
  decisionColumn: string;
  /** Values of the decision column that count as the favorable outcome. */
  favorableValues: string[];
  sensitive: SensitiveSpec[];
  groundTruthColumn?: string;
  groundTruthFavorableValues?: string[];
}

/** A proportion with its 95% confidence interval. */
export interface Proportion {
  /** Number of "successes". */
  k: number;
  /** Denominator. */
  n: number;
  /** k / n, or null when n = 0. */
  value: number | null;
  lower: number | null;
  upper: number | null;
}

export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface GroupStats {
  group: string;
  n: number;
  selectionRate: Proportion;
  /** Present only when ground truth is available. */
  confusion?: Confusion;
  tpr?: Proportion;
  fpr?: Proportion;
  precision?: Proportion;
  accuracy?: Proportion;
  baseRate?: Proportion;
}

/**
 * Verdict of a single comparison.
 * - ok: within the threshold
 * - concern: beyond the threshold and the gap is statistically clear
 * - inconclusive: beyond the threshold but the intervals overlap too much
 * - insufficient: at least one group has fewer than MIN_GROUP_SIZE rows
 * - na: the metric cannot be computed (e.g. a group has no actual positives)
 */
export type Verdict = 'ok' | 'concern' | 'inconclusive' | 'insufficient' | 'na';

export type MetricKey =
  | 'disparateImpact'
  | 'demographicParity'
  | 'equalOpportunity'
  | 'equalizedOdds'
  | 'predictiveParity'
  | 'accuracyParity';

export interface Interval {
  value: number | null;
  lower: number | null;
  upper: number | null;
}

export interface MetricResult {
  key: MetricKey;
  /** Group with the lowest (worst) rate for this metric. */
  worstGroup: string | null;
  /** Group used as the comparison baseline (highest rate). */
  bestGroup: string | null;
  worstValue: number | null;
  bestValue: number | null;
  /** best − worst (absolute gap) with a Newcombe 95% interval. */
  difference: Interval;
  /** worst / best with a Katz log 95% interval (only for rate ratios). */
  ratio?: Interval;
  threshold: number;
  verdict: Verdict;
  /** For equalized odds: which component (tpr / fpr) drives the result. */
  component?: 'tpr' | 'fpr';
}

export interface AttributeAudit {
  /** Display name, e.g. "sex" or "sex × age". */
  attribute: string;
  columns: string[];
  groups: GroupStats[];
  metrics: MetricResult[];
}

export interface HeatmapCell {
  rowGroup: string;
  colGroup: string;
  stats: GroupStats;
}

export interface IntersectionalResult {
  rowAttribute: string;
  colAttribute: string;
  rowGroups: string[];
  colGroups: string[];
  cells: HeatmapCell[];
}

export interface AuditResult {
  rowCount: number;
  /** Rows dropped because the decision / sensitive / truth value was missing. */
  droppedRows: number;
  overall: GroupStats;
  hasGroundTruth: boolean;
  attributes: AttributeAudit[];
  intersectional?: IntersectionalResult;
  /** True when every decision has the same value. */
  singleClass: boolean;
  generatedAt: string;
}

export interface FeatureInsight {
  feature: string;
  /** Cramér's V between feature (binned if numeric) and sensitive groups. */
  cramersV: number;
  /** Normalized mutual information (0..1). */
  mutualInfo: number;
  /** Mean drop in accuracy when the feature is shuffled. */
  permutationImportance: number;
  /** Largest absolute standardized coefficient across the feature's columns. */
  coefficient: number;
  isProxy: boolean;
}

export interface ModelEvaluation {
  accuracy: number;
  groups: GroupStats[];
  disparateImpact: MetricResult;
  demographicParity: MetricResult;
  equalOpportunity?: MetricResult;
}

export interface DeeperResult {
  attribute: string;
  target: 'decision' | 'groundTruth';
  trainSize: number;
  testSize: number;
  featureCount: number;
  droppedFeatures: string[];
  features: FeatureInsight[];
  baseline: ModelEvaluation;
  reweighed: ModelEvaluation;
  weights: { group: string; label: 0 | 1; weight: number }[];
}
