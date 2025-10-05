/**
 * Regression Models for PA Optimization
 * Implements multiple mathematical models for fitting PA data
 */

import type { PATestResult, FittedModel, ModelType } from './types';

/**
 * Calculate R² (coefficient of determination)
 */
function calculateR2(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
  const ssTotal = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
  const ssResidual = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  return 1 - (ssResidual / ssTotal);
}

/**
 * Calculate RMSE (root mean square error)
 */
function calculateRMSE(actual: number[], predicted: number[]): number {
  const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / actual.length;
  return Math.sqrt(mse);
}

/**
 * Exponential Decay Model (Physics-Based)
 * PA = a × exp(-b×flow) × exp(-c×accel)
 *
 * This model represents the physical pressure dynamics in the extruder.
 * Higher flow and acceleration naturally reduce the PA needed.
 */
export function fitExponentialDecay(data: PATestResult[]): FittedModel {
  // Transform to linear space: ln(PA) = ln(a) - b×flow - c×accel
  const n = data.length;

  // Calculate means
  let sumLogPA = 0, sumFlow = 0, sumAccel = 0;
  data.forEach(d => {
    sumLogPA += Math.log(d.paValue);
    sumFlow += d.flow;
    sumAccel += d.accel / 1000; // Scale acceleration
  });

  const meanLogPA = sumLogPA / n;
  const meanFlow = sumFlow / n;
  const meanAccel = sumAccel / n;

  // Calculate sums of products
  let ssFlow = 0, ssAccel = 0, spFlowLogPA = 0, spAccelLogPA = 0;
  data.forEach(d => {
    const logPA = Math.log(d.paValue) - meanLogPA;
    const flow = d.flow - meanFlow;
    const accel = d.accel / 1000 - meanAccel;

    ssFlow += flow * flow;
    ssAccel += accel * accel;
    spFlowLogPA += flow * logPA;
    spAccelLogPA += accel * logPA;
  });

  // Calculate coefficients
  const b = -spFlowLogPA / ssFlow;
  const c = -spAccelLogPA / ssAccel;
  const a = Math.exp(meanLogPA + b * meanFlow + c * meanAccel);

  // Prediction function
  const predict = (flow: number, accel: number): number => {
    return a * Math.exp(-b * flow) * Math.exp(-c * accel / 1000);
  };

  // Calculate residuals and metrics
  const predicted = data.map(d => predict(d.flow, d.accel));
  const actual = data.map(d => d.paValue);
  const residuals = actual.map((val, i) => val - predicted[i]);

  return {
    modelType: 'exponential_decay',
    coefficients: { a, b, c },
    r2: calculateR2(actual, predicted),
    rmse: calculateRMSE(actual, predicted),
    residuals,
    predict,
  };
}

/**
 * Power Law Model
 * PA = a × flow^b × accel^c
 */
export function fitPowerLaw(data: PATestResult[]): FittedModel {
  // Transform to linear space: ln(PA) = ln(a) + b×ln(flow) + c×ln(accel)
  const n = data.length;

  // Calculate means
  let sumLogPA = 0, sumLogFlow = 0, sumLogAccel = 0;
  data.forEach(d => {
    sumLogPA += Math.log(d.paValue);
    sumLogFlow += Math.log(d.flow);
    sumLogAccel += Math.log(d.accel);
  });

  const meanLogPA = sumLogPA / n;
  const meanLogFlow = sumLogFlow / n;
  const meanLogAccel = sumLogAccel / n;

  // Calculate sums of products
  let ssLogFlow = 0, ssLogAccel = 0, spLogFlowLogPA = 0, spLogAccelLogPA = 0;
  data.forEach(d => {
    const logPA = Math.log(d.paValue) - meanLogPA;
    const logFlow = Math.log(d.flow) - meanLogFlow;
    const logAccel = Math.log(d.accel) - meanLogAccel;

    ssLogFlow += logFlow * logFlow;
    ssLogAccel += logAccel * logAccel;
    spLogFlowLogPA += logFlow * logPA;
    spLogAccelLogPA += logAccel * logPA;
  });

  // Calculate coefficients
  const b = spLogFlowLogPA / ssLogFlow;
  const c = spLogAccelLogPA / ssLogAccel;
  const a = Math.exp(meanLogPA - b * meanLogFlow - c * meanLogAccel);

  // Prediction function
  const predict = (flow: number, accel: number): number => {
    return a * Math.pow(flow, b) * Math.pow(accel, c);
  };

  // Calculate residuals and metrics
  const predicted = data.map(d => predict(d.flow, d.accel));
  const actual = data.map(d => d.paValue);
  const residuals = actual.map((val, i) => val - predicted[i]);

  return {
    modelType: 'power_law',
    coefficients: { a, b, c },
    r2: calculateR2(actual, predicted),
    rmse: calculateRMSE(actual, predicted),
    residuals,
    predict,
  };
}

/**
 * Matrix transpose
 */
function transposeMatrix(m: number[][]): number[][] {
  return m[0].map((_, i) => m.map(row => row[i]));
}

/**
 * Matrix multiplication
 */
function multiplyMatrices(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < a[0].length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Matrix-vector multiplication
 */
function multiplyMatrixVector(m: number[][], v: number[]): number[] {
  return m.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
}

/**
 * Solve linear system using Gaussian elimination
 */
function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]]);

  // Forward elimination with partial pivoting
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(aug[k][i]) > Math.abs(aug[maxRow][i])) {
        maxRow = k;
      }
    }
    [aug[i], aug[maxRow]] = [aug[maxRow], aug[i]];

    // Eliminate
    for (let k = i + 1; k < n; k++) {
      const factor = aug[k][i] / aug[i][i];
      for (let j = i; j <= n; j++) {
        aug[k][j] -= factor * aug[i][j];
      }
    }
  }

  // Back substitution
  const x: number[] = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= aug[i][j] * x[j];
    }
    x[i] = sum / aug[i][i];
  }

  return x;
}

/**
 * Polynomial Model (2nd Order)
 * PA = a + b×flow + c×accel + d×flow² + e×accel²
 */
export function fitPolynomial(data: PATestResult[]): FittedModel {
  // Build design matrix
  const X = data.map(d => [
    1,
    d.flow,
    d.accel / 1000, // Scale acceleration
    d.flow * d.flow,
    (d.accel / 1000) * (d.accel / 1000),
  ]);

  const y = data.map(d => d.paValue);

  // Normal equations: β = (X'X)^(-1) X'y
  const XtX = multiplyMatrices(transposeMatrix(X), X);
  const Xty = multiplyMatrixVector(transposeMatrix(X), y);
  const beta = solveLinearSystem(XtX, Xty);

  // Prediction function
  const predict = (flow: number, accel: number): number => {
    const a = accel / 1000;
    const result = beta[0] + beta[1] * flow + beta[2] * a +
                   beta[3] * flow * flow + beta[4] * a * a;
    return Math.max(0.001, result); // Prevent negative PA
  };

  // Calculate residuals and metrics
  const predicted = data.map(d => predict(d.flow, d.accel));
  const actual = data.map(d => d.paValue);
  const residuals = actual.map((val, i) => val - predicted[i]);

  return {
    modelType: 'polynomial',
    coefficients: {
      a: beta[0],
      b: beta[1],
      c: beta[2],
      d: beta[3],
      e: beta[4]
    },
    r2: calculateR2(actual, predicted),
    rmse: calculateRMSE(actual, predicted),
    residuals,
    predict,
  };
}

/**
 * Robust Polynomial Model (RANSAC)
 * Uses RANSAC to fit polynomial model with outlier resistance
 */
export function fitRobustPolynomial(data: PATestResult[]): FittedModel {
  const iterations = 100;
  const threshold = 0.003; // Inlier threshold
  let bestModel: FittedModel | null = null;
  let bestInliers = 0;

  for (let iter = 0; iter < iterations; iter++) {
    // Sample random subset (5 points minimum)
    const sampleSize = Math.min(5, data.length);
    const sample: PATestResult[] = [];
    const indices = new Set<number>();

    while (sample.length < sampleSize) {
      const idx = Math.floor(Math.random() * data.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        sample.push(data[idx]);
      }
    }

    // Fit model on sample
    const model = fitPolynomial(sample);

    // Count inliers
    let inliers = 0;
    data.forEach(d => {
      const predicted = model.predict(d.flow, d.accel);
      if (Math.abs(predicted - d.paValue) < threshold) {
        inliers++;
      }
    });

    if (inliers > bestInliers) {
      bestInliers = inliers;
      bestModel = model;
    }
  }

  // If RANSAC succeeded, return best model; otherwise fallback to standard polynomial
  if (bestModel) {
    return {
      ...bestModel,
      modelType: 'robust_polynomial',
    };
  }

  return {
    ...fitPolynomial(data),
    modelType: 'robust_polynomial',
  };
}

/**
 * Get all available models
 */
export const regressionModels = {
  exponential_decay: {
    name: 'Exponential Decay',
    description: 'PA = a × exp(-b×flow) × exp(-c×accel). Physics-based model.',
    physics_based: true,
    fit: fitExponentialDecay,
  },
  power_law: {
    name: 'Power Law',
    description: 'PA = a × flow^b × accel^c. Non-linear relationships.',
    physics_based: false,
    fit: fitPowerLaw,
  },
  polynomial: {
    name: 'Polynomial (2nd Order)',
    description: 'PA = a + b×flow + c×accel + d×flow² + e×accel². Flexible fitting.',
    physics_based: false,
    fit: fitPolynomial,
  },
  robust_polynomial: {
    name: 'Robust Polynomial (RANSAC)',
    description: 'Outlier-resistant polynomial fitting. Best for noisy data.',
    physics_based: false,
    fit: fitRobustPolynomial,
  },
} as const;
