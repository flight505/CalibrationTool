/**
 * Model Comparison and Auto-Selection
 * Compares different regression models and selects the best one
 */

import type {
  PATestResult,
  ModelComparison,
  ModelType,
  FittedModel,
  TrendAnalysis,
  OutlierResult,
} from './types';
import { regressionModels } from './regressionModels';

/**
 * Fit all available models to the data
 */
export function fitAllModels(data: PATestResult[]): Map<ModelType, FittedModel> {
  const results = new Map<ModelType, FittedModel>();

  Object.entries(regressionModels).forEach(([type, model]) => {
    try {
      const fitted = model.fit(data);
      results.set(type as ModelType, fitted);
    } catch (error) {
      console.error(`Error fitting ${type} model:`, error);
    }
  });

  return results;
}

/**
 * Auto-select the best model based on data characteristics
 */
export function autoSelectModel(
  data: PATestResult[],
  trends: TrendAnalysis,
  outliers: OutlierResult[],
  fittedModels: Map<ModelType, FittedModel>
): ModelType {
  const outlierCount = outliers.filter(o => o.isOutlier).length;
  const hasInvertedTrends =
    trends.flowTrend.actualDirection === 'inverted' ||
    trends.accelTrend.actualDirection === 'inverted';

  // Rule 1: If there are 2+ outliers, use robust polynomial
  if (outlierCount >= 2) {
    return 'robust_polynomial';
  }

  // Rule 2: If trends are inverted, use exponential to force physics
  if (hasInvertedTrends) {
    return 'exponential_decay';
  }

  // Rule 3: If data is highly variable (CV > 25%), use robust polynomial
  const paValues = data.map(d => d.paValue);
  const mean = paValues.reduce((sum, val) => sum + val, 0) / paValues.length;
  const stdDev = Math.sqrt(
    paValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / paValues.length
  );
  const cv = (stdDev / mean) * 100;
  if (cv > 25) {
    return 'robust_polynomial';
  }

  // Rule 4: Otherwise, select model with highest R²
  let bestModel: ModelType = 'exponential_decay';
  let bestR2 = -Infinity;

  fittedModels.forEach((model, type) => {
    if (model.r2 > bestR2) {
      bestR2 = model.r2;
      bestModel = type;
    }
  });

  return bestModel;
}

/**
 * Generate model-specific warnings
 */
function generateModelWarnings(model: FittedModel): string[] {
  const warnings: string[] = [];

  if (model.r2 < 0.80) {
    warnings.push('Low R² - model does not fit data well');
  }

  if (model.rmse > 0.005) {
    warnings.push('High RMSE - predictions may have significant error');
  }

  // Check for extreme coefficients in polynomial
  if (model.modelType === 'polynomial' || model.modelType === 'robust_polynomial') {
    const coeffs = Object.values(model.coefficients);
    if (coeffs.some(c => Math.abs(c) > 10)) {
      warnings.push('Extreme coefficients detected - model may be overfitting');
    }
  }

  return warnings;
}

/**
 * Determine selection reason based on auto-selection logic
 */
function getSelectionReason(
  selectedType: ModelType,
  trends: TrendAnalysis,
  outliers: OutlierResult[],
  fittedModel: FittedModel
): string {
  const outlierCount = outliers.filter(o => o.isOutlier).length;

  if (selectedType === 'robust_polynomial' && outlierCount >= 2) {
    return `Selected for outlier resistance (${outlierCount} outliers detected)`;
  }

  if (selectedType === 'exponential_decay' &&
      (trends.flowTrend.actualDirection === 'inverted' ||
       trends.accelTrend.actualDirection === 'inverted')) {
    return 'Selected to enforce physically correct trends';
  }

  return `Best R² score (${fittedModel.r2.toFixed(4)})`;
}

/**
 * Compare all models and recommend the best one
 */
export function compareModels(
  data: PATestResult[],
  trends: TrendAnalysis,
  outliers: OutlierResult[]
): ModelComparison {
  const fittedModels = fitAllModels(data);
  const autoSelected = autoSelectModel(data, trends, outliers, fittedModels);

  const models = Array.from(fittedModels.entries()).map(([type, model]) => {
    const modelInfo = regressionModels[type];
    return {
      type,
      name: modelInfo.name,
      r2: model.r2,
      rmse: model.rmse,
      selected: type === autoSelected,
      warnings: generateModelWarnings(model),
    };
  });

  // Sort by R² descending
  models.sort((a, b) => b.r2 - a.r2);

  const selectedModel = fittedModels.get(autoSelected)!;
  const reason = getSelectionReason(autoSelected, trends, outliers, selectedModel);

  return {
    models,
    autoSelectedModel: autoSelected,
    reason,
  };
}

/**
 * Get a specific fitted model
 */
export function getModel(
  data: PATestResult[],
  modelType: ModelType
): FittedModel {
  const modelFn = regressionModels[modelType];
  if (!modelFn) {
    throw new Error(`Unknown model type: ${modelType}`);
  }
  return modelFn.fit(data);
}
