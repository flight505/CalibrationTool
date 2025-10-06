/**
 * Core types for Pressure Advance Optimizer
 */

export type GridSize = '3x3' | '4x4' | 'custom';
export type TrendDirection = 'correct' | 'inverted' | 'inconsistent';
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ModelType = 'exponential_decay' | 'power_law' | 'polynomial' | 'robust_polynomial';

/**
 * Configuration for the PA test
 */
export interface PATestConfig {
  gridSize: GridSize;
  speeds: number[];        // [120, 150, 200] for 3x3
  accelerations: number[]; // [4000, 6000, 10000] for 3x3
  startPA: number;
  endPA: number;
  paStep: number;
  layerHeight: number;
  lineWidth: number;
}

/**
 * Individual test result from one tile
 */
export interface PATestResult {
  tileId: number;
  speed: number;
  accel: number;
  flow: number;      // Measured or calculated mm³/s
  chevron?: number;  // Optional chevron number
  paValue: number;   // Measured PA value
}

/**
 * Trend analysis for a single dimension (flow or accel)
 */
export interface DimensionTrend {
  dimension: 'flow' | 'accel';
  expectedDirection: 'decreasing';
  actualDirection: TrendDirection;
  details: Array<{
    fixedValue: number;    // The fixed accel (for flow trends) or fixed flow (for accel trends)
    isDecreasing: boolean;
    slope: number;
    delta: number;         // Ending PA minus starting PA across the range
    span: number;          // Range of the varying dimension (flow or accel)
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
    dataPoints: Array<{ x: number; y: number }>;
  }>;
}

/**
 * Complete trend analysis results
 */
export interface TrendAnalysis {
  flowTrend: DimensionTrend;
  accelTrend: DimensionTrend;
  overallQuality: TrendDirection;
  warnings: string[];
}

/**
 * Statistical analysis results
 */
export interface StatisticalAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  coefficientOfVariation: number; // CV as percentage
  range: [number, number];
  iqr: number; // Interquartile range
}

/**
 * Outlier detection result
 */
export interface OutlierResult {
  tileId: number;
  paValue: number;
  deviation: number;      // How many std devs from mean
  isOutlier: boolean;
  method: 'iqr' | 'stddev' | 'residual';
}

/**
 * Quality assessment
 */
export interface QualityScore {
  overallScore: number;    // 0-100
  confidence: ConfidenceLevel;
  trendScore: number;      // 0-40
  variabilityScore: number; // 0-30
  modelFitScore: number;   // 0-30
  warnings: string[];
  recommendations: string[];
}

/**
 * Base interface for all regression models
 */
export interface RegressionModel {
  name: string;
  type: ModelType;
  description: string;
  physics_based: boolean;

  /**
   * Fit the model to the data
   */
  fit(data: PATestResult[]): FittedModel;
}

/**
 * Result of fitting a model
 */
export interface FittedModel {
  modelType: ModelType;
  coefficients: Record<string, number>;
  r2: number;               // R-squared (0-1)
  rmse: number;             // Root mean square error
  residuals: number[];

  /**
   * Predict PA value for given flow and accel
   */
  predict(flow: number, accel: number): number;
}

/**
 * Model comparison results
 */
export interface ModelComparison {
  models: Array<{
    type: ModelType;
    name: string;
    r2: number;
    rmse: number;
    selected: boolean;
    warnings: string[];
  }>;
  autoSelectedModel: ModelType;
  reason: string;
}

/**
 * Options for table generation
 */
export interface TableGenerationOptions {
  targetSpeeds: number[];     // e.g., [40, 60, 80, 100, 120, 150, 200]
  targetAccels: number[];     // e.g., [3000, 4000, 6000, 8000, 10000]
  extrapolationLimit: number; // Max % beyond calibrated range (default: 50%)
  minPA: number;              // Safety bounds
  maxPA: number;
}

/**
 * Generated table entry
 */
export interface PATableEntry {
  speed: number;
  flow: number;
  accel: number;
  paValue: number;
  confidence: ConfidenceLevel;
  isExtrapolated: boolean;
  extrapolationAmount?: number; // % beyond calibrated range
}

/**
 * Complete PA table with metadata
 */
export interface PATable {
  entries: PATableEntry[];
  calibratedRange: {
    flowRange: [number, number];
    accelRange: [number, number];
  };
  modelUsed: ModelType;
  generatedAt: Date;
}

/**
 * Complete analysis result
 */
export interface PAAnalysisResult {
  config: PATestConfig;
  testData: PATestResult[];
  trends: TrendAnalysis;
  statistics: StatisticalAnalysis;
  outliers: OutlierResult[];
  qualityScore: QualityScore;
  modelComparison: ModelComparison;
  selectedModel: FittedModel;
  optimizedTable: PATable;
  extendedTable: PATable;
}
