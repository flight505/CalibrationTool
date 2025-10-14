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
  OutlierResult,
  FittedModel,
} from './types';
import { analyzeTrends } from './trendAnalysis';
import { calculateStatistics, detectOutliers, calculateQualityScore } from './statisticsEngine';
import { compareModels, getModel } from './modelComparison';

/**
 * Apply outlier correction to test data
 */
function applyOutlierCorrection(
  originalData: PATestResult[],
  outliers: OutlierResult[],
  model: FittedModel,
  mode: 'none' | 'ransac' | 'model'
): PATestResult[] {
  if (mode === 'none') {
    return originalData;
  }

  const outlierSet = new Set(outliers.filter(o => o.isOutlier).map(o => o.tileId));

  return originalData.map(test => {
    const shouldCorrect = mode === 'model' || (mode === 'ransac' && outlierSet.has(test.tileId));

    if (shouldCorrect) {
      const correctedValue = model.predict(test.flow, test.accel);
      return {
        ...test,
        originalPAValue: test.paValue,
        paValue: Math.max(0.001, Math.min(1.0, correctedValue)),
        isCorrected: true,
      };
    }

    return test;
  });
}

/**
 * Perform complete PA analysis on test data
 */
export function analyzePA(
  config: PATestConfig,
  testData: PATestResult[],
  preferredModel?: ModelType,
  outlierCorrectionMode: 'none' | 'ransac' | 'model' = 'none'
): PAAnalysisResult {
  // Store original data
  const originalData = [...testData];

  // 1. Trend analysis (on original data)
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

  // 6. Apply outlier correction if requested
  const correctedData = applyOutlierCorrection(testData, outliers, selectedModel, outlierCorrectionMode);

  // 7. Calculate quality score
  const qualityScore = calculateQualityScore(trends, statistics, selectedModel, outliers);

  // 8. Generate optimized table (use corrected data!)
  const optimizedTable = generateOptimizedTable(correctedData, selectedModel);

  // 8. Generate extended table (with extrapolation)
  const extendedTable = generateExtendedTable(testData, selectedModel, {
    targetSpeeds: [40, 60, 80, 100, 120, 150, 200, 250, 300],
    targetAccels: [3000, 4000, 6000, 8000, 10000, 12000],
    extrapolationLimit: 50, // Allow 50% extrapolation
    minPA: 0.001,
    maxPA: 1.0,
  });

  return {
    config,
    testData: correctedData,
    originalTestData: outlierCorrectionMode !== 'none' ? originalData : undefined,
    trends,
    statistics,
    outliers,
    qualityScore,
    modelComparison,
    selectedModel,
    optimizedTable,
    extendedTable,
    correctionApplied: outlierCorrectionMode,
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

/**
 * Generate optimized table using actual test data points (no extrapolation)
 */
export function generateOptimizedTable(
  calibrationData: PATestResult[],
  model: ReturnType<typeof getModel>
): PATable {
  const calibratedFlowRange: [number, number] = [
    Math.min(...calibrationData.map(d => d.flow)),
    Math.max(...calibrationData.map(d => d.flow)),
  ];

  const calibratedAccelRange: [number, number] = [
    Math.min(...calibrationData.map(d => d.accel)),
    Math.max(...calibrationData.map(d => d.accel)),
  ];

  // Use actual test data combinations
  const entries: PATableEntry[] = calibrationData.map(test => {
    // Predict PA value using the model
    let paValue = model.predict(test.flow, test.accel);

    // Apply safety bounds
    paValue = Math.max(0.001, Math.min(1.0, paValue));

    return {
      speed: test.speed,
      flow: test.flow,
      accel: test.accel,
      paValue,
      confidence: 'high' as ConfidenceLevel, // Original test points are high confidence
      isExtrapolated: false,
      extrapolationAmount: undefined,
    };
  });

  // Sort by speed, then acceleration
  entries.sort((a, b) => {
    if (a.speed !== b.speed) return a.speed - b.speed;
    return a.accel - b.accel;
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
 * Generate extended table with extrapolation to additional speeds/accels
 */
export function generateExtendedTable(
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

  // Calculate actual flow-to-speed ratio from calibration data
  // This ensures we use the ACTUAL nozzle/layer height/line width from the test
  const flowSpeedRatios = calibrationData.map(d => d.flow / d.speed);
  const avgFlowSpeedRatio = flowSpeedRatios.reduce((sum, r) => sum + r, 0) / flowSpeedRatios.length;

  const estimateFlow = (speed: number): number => {
    return speed * avgFlowSpeedRatio;
  };

  const entries: PATableEntry[] = [];

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

  // Sort by speed, then acceleration
  entries.sort((a, b) => {
    if (a.speed !== b.speed) return a.speed - b.speed;
    return a.accel - b.accel;
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
