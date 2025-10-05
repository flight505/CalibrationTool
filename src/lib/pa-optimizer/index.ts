/**
 * PA Optimizer - Main API
 * Orchestrates the complete PA optimization workflow
 */

export * from './types';
export * from './trendAnalysis';
export * from './statisticsEngine';
export * from './regressionModels';
export * from './modelComparison';

import type {
  PATestConfig,
  PATestResult,
  PAAnalysisResult,
  PATable,
  PATableEntry,
  TableGenerationOptions,
  ConfidenceLevel,
  ModelType,
} from './types';
import { analyzeTrends } from './trendAnalysis';
import { calculateStatistics, detectOutliers, calculateQualityScore } from './statisticsEngine';
import { compareModels, getModel } from './modelComparison';

/**
 * Perform complete PA analysis on test data
 */
export function analyzePA(
  config: PATestConfig,
  testData: PATestResult[],
  preferredModel?: ModelType
): PAAnalysisResult {
  // 1. Trend analysis
  const trends = analyzeTrends(testData);

  // 2. Statistical analysis
  const statistics = calculateStatistics(testData);

  // 3. Outlier detection
  const outliers = detectOutliers(testData, statistics);

  // 4. Model comparison and selection
  const modelComparison = compareModels(testData, trends, outliers);
  const selectedModelType = preferredModel || modelComparison.autoSelectedModel;

  // 5. Fit selected model
  const selectedModel = getModel(testData, selectedModelType);

  // 6. Calculate quality score
  const qualityScore = calculateQualityScore(trends, statistics, selectedModel, outliers);

  // 7. Generate optimized table (original test points)
  const optimizedTable = generateTable(testData, selectedModel, {
    targetSpeeds: [...new Set(testData.map(d => d.speed))].sort((a, b) => a - b),
    targetAccels: [...new Set(testData.map(d => d.accel))].sort((a, b) => a - b),
    extrapolationLimit: 0, // No extrapolation for optimized table
    minPA: 0.001,
    maxPA: 1.0,
  });

  // 8. Generate extended table (with extrapolation)
  const extendedTable = generateTable(testData, selectedModel, {
    targetSpeeds: [40, 60, 80, 100, 120, 150, 200],
    targetAccels: [3000, 4000, 6000, 8000, 10000],
    extrapolationLimit: 50, // Allow 50% extrapolation
    minPA: 0.001,
    maxPA: 1.0,
  });

  return {
    config,
    testData,
    trends,
    statistics,
    outliers,
    qualityScore,
    modelComparison,
    selectedModel,
    optimizedTable,
    extendedTable,
  };
}

/**
 * Generate PA table for specific speeds and accelerations
 */
export function generateTable(
  calibrationData: PATestResult[],
  model: ReturnType<typeof getModel>,
  options: TableGenerationOptions
): PATable {
  const calibratedFlowRange: [number, number] = [
    Math.min(...calibrationData.map(d => d.flow)),
    Math.max(...calibrationData.map(d => d.flow)),
  ];

  const calibratedAccelRange: [number, number] = [
    Math.min(...calibrationData.map(d => d.accel)),
    Math.max(...calibrationData.map(d => d.accel)),
  ];

  const entries: PATableEntry[] = [];

  // Estimate flow from speed (using layer height and line width from calibration data)
  const estimateFlow = (speed: number): number => {
    // Use average layer height and line width from calibration
    const avgLayerHeight = 0.16; // Typical default
    const avgLineWidth = 0.48; // Typical default
    return (speed * avgLayerHeight * avgLineWidth) / 60;
  };

  // Generate entries for each combination
  options.targetSpeeds.forEach(speed => {
    const flow = estimateFlow(speed);

    options.targetAccels.forEach(accel => {
      // Calculate extrapolation amount
      const flowExtrapolation = calculateExtrapolation(flow, calibratedFlowRange);
      const accelExtrapolation = calculateExtrapolation(accel, calibratedAccelRange);
      const maxExtrapolation = Math.max(flowExtrapolation, accelExtrapolation);

      // Skip if exceeds extrapolation limit
      if (maxExtrapolation > options.extrapolationLimit) {
        return;
      }

      // Predict PA value
      let paValue = model.predict(flow, accel);

      // Apply safety bounds
      paValue = Math.max(options.minPA, Math.min(options.maxPA, paValue));

      // Determine confidence
      let confidence: ConfidenceLevel;
      if (maxExtrapolation === 0) {
        confidence = 'high';
      } else if (maxExtrapolation < 25) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      entries.push({
        speed,
        flow,
        accel,
        paValue,
        confidence,
        isExtrapolated: maxExtrapolation > 0,
        extrapolationAmount: maxExtrapolation > 0 ? maxExtrapolation : undefined,
      });
    });
  });

  return {
    entries,
    calibratedRange: {
      flowRange: calibratedFlowRange,
      accelRange: calibratedAccelRange,
    },
    modelUsed: model.modelType,
    generatedAt: new Date(),
  };
}

/**
 * Calculate extrapolation percentage beyond calibrated range
 */
function calculateExtrapolation(value: number, range: [number, number]): number {
  if (value >= range[0] && value <= range[1]) {
    return 0; // Within range
  }

  const rangeSize = range[1] - range[0];

  if (value < range[0]) {
    return ((range[0] - value) / rangeSize) * 100;
  } else {
    return ((value - range[1]) / rangeSize) * 100;
  }
}

/**
 * Format PA table for OrcaSlicer (PA, flow, accel)
 */
export function formatForOrcaSlicer(table: PATable): string {
  return table.entries
    .map(entry => `${entry.paValue.toFixed(6)},${entry.flow.toFixed(2)},${entry.accel}`)
    .join('\n');
}

/**
 * Export PA table as CSV
 */
export function exportAsCSV(table: PATable): string {
  const header = 'Speed (mm/s),Flow (mm³/s),Accel (mm/s²),PA Value,Confidence,Extrapolated\n';
  const rows = table.entries.map(entry =>
    `${entry.speed},${entry.flow.toFixed(2)},${entry.accel},${entry.paValue.toFixed(6)},${entry.confidence},${entry.isExtrapolated}`
  );
  return header + rows.join('\n');
}
