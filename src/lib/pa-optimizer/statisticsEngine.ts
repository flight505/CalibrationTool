/**
 * Statistics Engine
 * Calculates statistical metrics and detects outliers
 */

import type {
  PATestResult,
  StatisticalAnalysis,
  OutlierResult,
  QualityScore,
  ConfidenceLevel,
  TrendAnalysis,
  FittedModel,
} from './types';

/**
 * Calculate mean of array
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median of array
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 */
function stdDev(values: number[], meanVal?: number): number {
  if (values.length === 0) return 0;
  const avg = meanVal !== undefined ? meanVal : mean(values);
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calculate interquartile range (IQR)
 */
function calculateIQR(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  return sorted[q3Index] - sorted[q1Index];
}

/**
 * Perform statistical analysis on PA test data
 */
export function calculateStatistics(data: PATestResult[]): StatisticalAnalysis {
  const paValues = data.map(d => d.paValue);

  const meanVal = mean(paValues);
  const medianVal = median(paValues);
  const stdDevVal = stdDev(paValues, meanVal);
  const cv = meanVal !== 0 ? (stdDevVal / meanVal) * 100 : 0;
  const minVal = Math.min(...paValues);
  const maxVal = Math.max(...paValues);
  const iqr = calculateIQR(paValues);

  return {
    mean: meanVal,
    median: medianVal,
    stdDev: stdDevVal,
    coefficientOfVariation: cv,
    range: [minVal, maxVal],
    iqr,
  };
}

/**
 * Detect outliers using IQR method
 */
function detectOutliersIQR(data: PATestResult[], stats: StatisticalAnalysis): OutlierResult[] {
  const paValues = data.map(d => d.paValue);
  const sorted = [...paValues].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = stats.iqr;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return data.map(result => ({
    tileId: result.tileId,
    paValue: result.paValue,
    deviation: Math.max(
      Math.abs(result.paValue - lowerBound),
      Math.abs(result.paValue - upperBound)
    ),
    isOutlier: result.paValue < lowerBound || result.paValue > upperBound,
    method: 'iqr' as const,
  }));
}

/**
 * Detect outliers using standard deviation method
 */
function detectOutliersStdDev(data: PATestResult[], stats: StatisticalAnalysis): OutlierResult[] {
  const threshold = 2.0; // 2 standard deviations

  return data.map(result => {
    const deviation = Math.abs(result.paValue - stats.mean) / stats.stdDev;
    return {
      tileId: result.tileId,
      paValue: result.paValue,
      deviation,
      isOutlier: deviation > threshold,
      method: 'stddev' as const,
    };
  });
}

/**
 * Detect outliers using residual analysis (requires fitted model)
 */
export function detectOutliersResidual(
  data: PATestResult[],
  model: FittedModel
): OutlierResult[] {
  const residuals = data.map((result, i) => {
    const predicted = model.predict(result.flow, result.accel);
    return Math.abs(result.paValue - predicted);
  });

  const meanResidual = mean(residuals);
  const stdDevResidual = stdDev(residuals, meanResidual);
  const threshold = meanResidual + 1.5 * stdDevResidual;

  return data.map((result, i) => ({
    tileId: result.tileId,
    paValue: result.paValue,
    deviation: residuals[i] / stdDevResidual,
    isOutlier: residuals[i] > threshold,
    method: 'residual' as const,
  }));
}

/**
 * Detect outliers using both IQR and StdDev methods
 */
export function detectOutliers(
  data: PATestResult[],
  stats: StatisticalAnalysis
): OutlierResult[] {
  const iqrOutliers = detectOutliersIQR(data, stats);
  const stdDevOutliers = detectOutliersStdDev(data, stats);

  // Combine results: mark as outlier if EITHER method flags it
  return data.map((result, i) => ({
    tileId: result.tileId,
    paValue: result.paValue,
    deviation: Math.max(iqrOutliers[i].deviation, stdDevOutliers[i].deviation),
    isOutlier: iqrOutliers[i].isOutlier || stdDevOutliers[i].isOutlier,
    method: iqrOutliers[i].isOutlier ? 'iqr' : 'stddev',
  }));
}

/**
 * Calculate variability score (0-30) for quality assessment
 * Lower variability = higher score
 */
export function calculateVariabilityScore(stats: StatisticalAnalysis): number {
  const cv = stats.coefficientOfVariation;

  // CV thresholds:
  // < 10% = excellent (30 points)
  // 10-20% = good (20 points)
  // 20-30% = acceptable (10 points)
  // > 30% = poor (0 points)

  if (cv < 10) {
    return 30;
  } else if (cv < 20) {
    return 30 - ((cv - 10) / 10) * 10; // Linear interpolation from 30 to 20
  } else if (cv < 30) {
    return 20 - ((cv - 20) / 10) * 10; // Linear interpolation from 20 to 10
  } else if (cv < 40) {
    return 10 - ((cv - 30) / 10) * 10; // Linear interpolation from 10 to 0
  } else {
    return 0;
  }
}

/**
 * Calculate model fit score (0-30) based on R² value
 */
export function calculateModelFitScore(r2: number): number {
  // R² thresholds:
  // > 0.95 = excellent (30 points)
  // 0.90-0.95 = good (25 points)
  // 0.85-0.90 = acceptable (20 points)
  // 0.80-0.85 = marginal (15 points)
  // < 0.80 = poor (0-10 points)

  if (r2 > 0.95) {
    return 30;
  } else if (r2 > 0.90) {
    return 25 + ((r2 - 0.90) / 0.05) * 5;
  } else if (r2 > 0.85) {
    return 20 + ((r2 - 0.85) / 0.05) * 5;
  } else if (r2 > 0.80) {
    return 15 + ((r2 - 0.80) / 0.05) * 5;
  } else if (r2 > 0.70) {
    return ((r2 - 0.70) / 0.10) * 10;
  } else {
    return 0;
  }
}

/**
 * Determine confidence level from overall score
 */
function determineConfidence(score: number): ConfidenceLevel {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

/**
 * Generate quality warnings and recommendations
 */
function generateQualityMessages(
  score: number,
  trendScore: number,
  variabilityScore: number,
  modelFitScore: number,
  stats: StatisticalAnalysis,
  outlierCount: number
): { warnings: string[]; recommendations: string[] } {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Variability warnings
  if (stats.coefficientOfVariation > 30) {
    warnings.push(`High variability detected (CV: ${stats.coefficientOfVariation.toFixed(1)}%). Results may be inconsistent.`);
    recommendations.push('Consider re-running the test with more careful measurement.');
  } else if (stats.coefficientOfVariation > 20) {
    warnings.push(`Moderate variability (CV: ${stats.coefficientOfVariation.toFixed(1)}%). Some inconsistency in results.`);
  }

  // Outlier warnings
  if (outlierCount > 0) {
    warnings.push(`${outlierCount} outlier(s) detected. These may indicate measurement errors.`);
    recommendations.push('Review outlier tiles and consider excluding them from analysis.');
  }

  // Trend warnings
  if (trendScore < 20) {
    warnings.push('Poor trend quality. PA values do not follow expected physical behavior.');
    recommendations.push('Check test setup: ensure pressure advance is disabled during calibration.');
  }

  // Model fit warnings
  if (modelFitScore < 15) {
    warnings.push('Poor model fit (low R²). The mathematical model does not match your data well.');
    recommendations.push('Consider using a different regression model or collecting more data points.');
  }

  // Overall score feedback
  if (score >= 80) {
    recommendations.push('✓ Excellent calibration! Results are highly reliable.');
  } else if (score >= 60) {
    recommendations.push('Results are acceptable. Minor improvements possible with more precise measurement.');
  } else {
    recommendations.push('⚠️ Results have significant issues. Consider re-running the calibration test.');
  }

  return { warnings, recommendations };
}

/**
 * Calculate comprehensive quality score
 */
export function calculateQualityScore(
  trends: TrendAnalysis,
  stats: StatisticalAnalysis,
  model: FittedModel,
  outliers: OutlierResult[]
): QualityScore {
  const trendScore = calculateTrendScore(trends);
  const variabilityScore = calculateVariabilityScore(stats);
  const modelFitScore = calculateModelFitScore(model.r2);

  const overallScore = trendScore + variabilityScore + modelFitScore;
  const confidence = determineConfidence(overallScore);

  const outlierCount = outliers.filter(o => o.isOutlier).length;
  const { warnings, recommendations } = generateQualityMessages(
    overallScore,
    trendScore,
    variabilityScore,
    modelFitScore,
    stats,
    outlierCount
  );

  return {
    overallScore,
    confidence,
    trendScore,
    variabilityScore,
    modelFitScore,
    warnings,
    recommendations,
  };
}

/**
 * Helper function to calculate trend score (exported for standalone use)
 */
function calculateTrendScore(trends: TrendAnalysis): number {
  let score = 0;

  // Flow trend scoring (0-20)
  if (trends.flowTrend.actualDirection === 'correct') {
    score += 20;
  } else if (trends.flowTrend.actualDirection === 'inconsistent') {
    const correctCount = trends.flowTrend.details.filter(d => d.isDecreasing).length;
    score += (correctCount / trends.flowTrend.details.length) * 20;
  }

  // Accel trend scoring (0-20)
  if (trends.accelTrend.actualDirection === 'correct') {
    score += 20;
  } else if (trends.accelTrend.actualDirection === 'inconsistent') {
    const correctCount = trends.accelTrend.details.filter(d => d.isDecreasing).length;
    score += (correctCount / trends.accelTrend.details.length) * 20;
  }

  return Math.round(score);
}
