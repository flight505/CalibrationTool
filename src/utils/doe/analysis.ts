import {
  ExperimentFactor,
  ExperimentRun,
  MainEffectAnalysis,
  SNRAnalysis,
  ResponseType,
  ANOVATable,
  ANOVASource
} from './doeTypes';

function mean(values: number[]): number {
  if (!values.length) return NaN;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / (values.length - 1);
}

export function calculateMainEffects(
  runs: ExperimentRun[],
  factors: ExperimentFactor[],
  metricId: string
): MainEffectAnalysis[] {
  return factors.map((factor) => {
    const levelMeans = factor.levels.map((level) => {
      const values = runs
        .filter((run) => run.factorSettings[factor.name] === level)
        .map((run) => run.measurements?.[metricId])
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      return values.length ? mean(values) : NaN;
    });

    const validMeans = levelMeans.filter((value) => !Number.isNaN(value));
    const effect = validMeans.length ? Math.max(...validMeans) - Math.min(...validMeans) : 0;

    return {
      factor: factor.name,
      levels: factor.levels,
      means: levelMeans,
      effect
    };
  });
}

function calculateLevelSnr(values: number[], responseType: ResponseType, target?: number): number {
  if (!values.length) {
    return Number.NEGATIVE_INFINITY;
  }

  const n = values.length;

  switch (responseType) {
    case 'larger-is-better': {
      const sum = values.reduce((acc, value) => acc + 1 / (value * value || 1e-6), 0);
      return -10 * Math.log10(sum / n);
    }
    case 'smaller-is-better': {
      const sum = values.reduce((acc, value) => acc + value * value, 0);
      return -10 * Math.log10(sum / n);
    }
    case 'nominal-is-best':
    default: {
      const meanValue = mean(values);
      const varValue = variance(values) || 1e-6;
      const targetValue = target ?? meanValue;
      return 10 * Math.log10((targetValue * targetValue) / varValue);
    }
  }
}

export function calculateSignalToNoise(
  runs: ExperimentRun[],
  factors: ExperimentFactor[],
  metricId: string,
  responseType: ResponseType,
  target?: number
): SNRAnalysis[] {
  return factors.map((factor) => {
    const snrValues = factor.levels.map((level) => {
      const values = runs
        .filter((run) => run.factorSettings[factor.name] === level)
        .map((run) => run.measurements?.[metricId])
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      return calculateLevelSnr(values, responseType, target);
    });

    const optimalIndex = snrValues.reduce((bestIndex, current, index, arr) =>
      current > arr[bestIndex] ? index : bestIndex,
      0
    );

    return {
      factor: factor.name,
      levels: factor.levels,
      snrValues,
      optimalLevel: factor.levels[optimalIndex]
    };
  });
}

export function predictOptimalSettings(mainEffects: MainEffectAnalysis[]): Record<string, number> {
  const optimal: Record<string, number> = {};

  mainEffects.forEach((effect) => {
    let bestValue = effect.levels[0];
    let bestMean = Number.NEGATIVE_INFINITY;

    effect.levels.forEach((level, index) => {
      const meanValue = effect.means[index];
      if (!Number.isNaN(meanValue) && meanValue > bestMean) {
        bestMean = meanValue;
        bestValue = level;
      }
    });

    optimal[effect.factor] = bestValue;
  });

  return optimal;
}

export function calculateANOVA(
  runs: ExperimentRun[],
  factors: ExperimentFactor[],
  metricId: string
): ANOVATable {
  const values = runs
    .map((run) => run.measurements?.[metricId])
    .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

  const totalCount = values.length;
  const overallMean = mean(values);

  let totalSS = 0;
  values.forEach((value) => {
    totalSS += (value - overallMean) ** 2;
  });

  const sources: ANOVASource[] = [];
  let explainedSS = 0;
  let totalDF = totalCount - 1;
  let explainedDF = 0;

  factors.forEach((factor) => {
    const levelMeans: number[] = [];
    const levelCounts: number[] = [];

    factor.levels.forEach((level) => {
      const levelValues = runs
        .filter((run) => run.factorSettings[factor.name] === level)
        .map((run) => run.measurements?.[metricId])
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value));

      levelMeans.push(mean(levelValues));
      levelCounts.push(levelValues.length);
    });

    let ssFactor = 0;
    levelMeans.forEach((levelMean, index) => {
      if (!Number.isNaN(levelMean)) {
        const count = levelCounts[index];
        ssFactor += count * (levelMean - overallMean) ** 2;
      }
    });

    const dfFactor = factor.levels.length - 1;
    explainedDF += dfFactor;
    explainedSS += ssFactor;

    const meanSquare = dfFactor > 0 ? ssFactor / dfFactor : 0;

    sources.push({
      name: factor.name,
      sumOfSquares: ssFactor,
      degreesOfFreedom: dfFactor,
      meanSquare,
      contribution: totalSS ? (ssFactor / totalSS) * 100 : 0
    });
  });

  const errorSS = Math.max(totalSS - explainedSS, 0);
  const errorDF = Math.max(totalDF - explainedDF, 1);
  const errorMS = errorSS / errorDF;

  sources.forEach((source) => {
    if (errorMS > 0) {
      source.fValue = source.meanSquare / errorMS;
    }
  });

  sources.push({
    name: 'Error',
    sumOfSquares: errorSS,
    degreesOfFreedom: errorDF,
    meanSquare: errorMS,
    contribution: totalSS ? (errorSS / totalSS) * 100 : 0
  });

  return {
    sources,
    totalSS,
    totalDF
  };
}
