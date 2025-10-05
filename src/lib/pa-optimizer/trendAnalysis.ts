/**
 * Trend Analysis Engine
 * Analyzes PA test data for expected physical trends
 */

import type {
  PATestResult,
  TrendAnalysis,
  DimensionTrend,
  TrendDirection,
} from './types';

/**
 * Calculate linear regression slope
 */
function calculateSlope(points: Array<{ x: number; y: number }>): number {
  if (points.length < 2) return 0;

  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return isFinite(slope) ? slope : 0;
}

/**
 * Analyze flow trend at each acceleration level
 * Expected: PA should DECREASE as flow increases
 */
function analyzeFlowTrend(data: PATestResult[]): DimensionTrend {
  // Group by acceleration
  const accelGroups = new Map<number, PATestResult[]>();
  data.forEach(result => {
    const group = accelGroups.get(result.accel) || [];
    group.push(result);
    accelGroups.set(result.accel, group);
  });

  const details = Array.from(accelGroups.entries()).map(([accel, group]) => {
    // Sort by flow
    const sorted = group.sort((a, b) => a.flow - b.flow);
    const points = sorted.map(r => ({ x: r.flow, y: r.paValue }));
    const slope = calculateSlope(points);

    return {
      fixedValue: accel,
      isDecreasing: slope < 0, // Negative slope means PA decreases with flow
      slope,
      dataPoints: points,
    };
  });

  // Determine overall trend
  const decreasingCount = details.filter(d => d.isDecreasing).length;
  const totalCount = details.length;

  let actualDirection: TrendDirection;
  if (decreasingCount === totalCount) {
    actualDirection = 'correct';
  } else if (decreasingCount === 0) {
    actualDirection = 'inverted';
  } else {
    actualDirection = 'inconsistent';
  }

  return {
    dimension: 'flow',
    expectedDirection: 'decreasing',
    actualDirection,
    details,
  };
}

/**
 * Analyze acceleration trend at each flow level
 * Expected: PA should DECREASE as acceleration increases
 */
function analyzeAccelTrend(data: PATestResult[]): DimensionTrend {
  // Group by flow (with tolerance for floating point)
  const flowGroups = new Map<string, PATestResult[]>();
  data.forEach(result => {
    const flowKey = result.flow.toFixed(2); // Group similar flows
    const group = flowGroups.get(flowKey) || [];
    group.push(result);
    flowGroups.set(flowKey, group);
  });

  const details = Array.from(flowGroups.entries()).map(([flowKey, group]) => {
    // Sort by acceleration
    const sorted = group.sort((a, b) => a.accel - b.accel);
    const points = sorted.map(r => ({ x: r.accel, y: r.paValue }));
    const slope = calculateSlope(points);

    return {
      fixedValue: parseFloat(flowKey),
      isDecreasing: slope < 0, // Negative slope means PA decreases with accel
      slope,
      dataPoints: points,
    };
  });

  // Determine overall trend
  const decreasingCount = details.filter(d => d.isDecreasing).length;
  const totalCount = details.length;

  let actualDirection: TrendDirection;
  if (decreasingCount === totalCount) {
    actualDirection = 'correct';
  } else if (decreasingCount === 0) {
    actualDirection = 'inverted';
  } else {
    actualDirection = 'inconsistent';
  }

  return {
    dimension: 'accel',
    expectedDirection: 'decreasing',
    actualDirection,
    details,
  };
}

/**
 * Generate warnings based on trend analysis
 */
function generateTrendWarnings(
  flowTrend: DimensionTrend,
  accelTrend: DimensionTrend
): string[] {
  const warnings: string[] = [];

  // Check flow trend
  if (flowTrend.actualDirection === 'inverted') {
    warnings.push(
      '⚠️ Flow trend is INVERTED: PA is increasing with flow (should decrease). This suggests measurement errors or incorrect test setup.'
    );
  } else if (flowTrend.actualDirection === 'inconsistent') {
    const invertedDetails = flowTrend.details.filter(d => !d.isDecreasing);
    warnings.push(
      `⚠️ Flow trend is INCONSISTENT: ${invertedDetails.length} of ${flowTrend.details.length} acceleration levels show inverted trends.`
    );
  }

  // Check accel trend
  if (accelTrend.actualDirection === 'inverted') {
    warnings.push(
      '⚠️ Acceleration trend is INVERTED: PA is increasing with acceleration (should decrease). This suggests measurement errors.'
    );
  } else if (accelTrend.actualDirection === 'inconsistent') {
    const invertedDetails = accelTrend.details.filter(d => !d.isDecreasing);
    warnings.push(
      `⚠️ Acceleration trend is INCONSISTENT: ${invertedDetails.length} of ${accelTrend.details.length} flow levels show inverted trends.`
    );
  }

  // Check for weak slopes (nearly flat)
  const weakFlowSlopes = flowTrend.details.filter(d => Math.abs(d.slope) < 0.0001);
  if (weakFlowSlopes.length > 0) {
    warnings.push(
      `ℹ️ ${weakFlowSlopes.length} flow trends show very weak slopes. PA may not vary significantly with flow in your test range.`
    );
  }

  return warnings;
}

/**
 * Determine overall trend quality
 */
function determineOverallQuality(
  flowTrend: DimensionTrend,
  accelTrend: DimensionTrend
): TrendDirection {
  if (flowTrend.actualDirection === 'correct' && accelTrend.actualDirection === 'correct') {
    return 'correct';
  }
  if (flowTrend.actualDirection === 'inverted' || accelTrend.actualDirection === 'inverted') {
    return 'inverted';
  }
  return 'inconsistent';
}

/**
 * Perform complete trend analysis on PA test data
 */
export function analyzeTrends(data: PATestResult[]): TrendAnalysis {
  if (data.length < 3) {
    throw new Error('Insufficient data for trend analysis. Need at least 3 test results.');
  }

  const flowTrend = analyzeFlowTrend(data);
  const accelTrend = analyzeAccelTrend(data);
  const warnings = generateTrendWarnings(flowTrend, accelTrend);
  const overallQuality = determineOverallQuality(flowTrend, accelTrend);

  return {
    flowTrend,
    accelTrend,
    overallQuality,
    warnings,
  };
}

/**
 * Calculate trend score (0-40) for quality assessment
 */
export function calculateTrendScore(trends: TrendAnalysis): number {
  let score = 0;

  // Flow trend scoring (0-20)
  if (trends.flowTrend.actualDirection === 'correct') {
    score += 20;
  } else if (trends.flowTrend.actualDirection === 'inconsistent') {
    const correctCount = trends.flowTrend.details.filter(d => d.isDecreasing).length;
    score += (correctCount / trends.flowTrend.details.length) * 20;
  }
  // Inverted = 0 points

  // Accel trend scoring (0-20)
  if (trends.accelTrend.actualDirection === 'correct') {
    score += 20;
  } else if (trends.accelTrend.actualDirection === 'inconsistent') {
    const correctCount = trends.accelTrend.details.filter(d => d.isDecreasing).length;
    score += (correctCount / trends.accelTrend.details.length) * 20;
  }
  // Inverted = 0 points

  return Math.round(score);
}
