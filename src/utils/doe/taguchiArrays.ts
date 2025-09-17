/**
 * Taguchi Orthogonal Array Generator for Design of Experiments (DOE)
 *
 * Implements standard orthogonal arrays (L9, L18, L27) for efficient
 * experimental design in 3D printing calibration.
 */

export interface Factor {
  name: string;
  parameter: string; // G-code or slicer parameter name
  levels: number[];  // Array of values to test
  unit: string;      // Unit of measurement
  description?: string;
}

export interface ExperimentRun {
  runNumber: number;
  factorSettings: Map<string, number>;
  factorIndices: number[]; // Indices into factor levels (0-based)
}

export interface TaguchiArray {
  type: 'L9' | 'L18' | 'L27';
  factors: Factor[];
  runs: ExperimentRun[];
  totalRuns: number;
  maxFactors: number;
  levels: number;
}

/**
 * L9 Orthogonal Array (3^4)
 * 9 runs for up to 4 factors at 3 levels each
 */
const L9_MATRIX = [
  [1, 1, 1, 1],
  [1, 2, 2, 2],
  [1, 3, 3, 3],
  [2, 1, 2, 3],
  [2, 2, 3, 1],
  [2, 3, 1, 2],
  [3, 1, 3, 2],
  [3, 2, 1, 3],
  [3, 3, 2, 1]
];

/**
 * L18 Orthogonal Array (2^1 × 3^7)
 * 18 runs for 1 factor at 2 levels and up to 7 factors at 3 levels
 */
const L18_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 2, 2, 2, 2, 2, 2],
  [1, 1, 3, 3, 3, 3, 3, 3],
  [1, 2, 1, 1, 2, 2, 3, 3],
  [1, 2, 2, 2, 3, 3, 1, 1],
  [1, 2, 3, 3, 1, 1, 2, 2],
  [1, 3, 1, 2, 1, 3, 2, 3],
  [1, 3, 2, 3, 2, 1, 3, 1],
  [1, 3, 3, 1, 3, 2, 1, 2],
  [2, 1, 1, 3, 3, 2, 2, 1],
  [2, 1, 2, 1, 1, 3, 3, 2],
  [2, 1, 3, 2, 2, 1, 1, 3],
  [2, 2, 1, 2, 3, 1, 3, 2],
  [2, 2, 2, 3, 1, 2, 1, 3],
  [2, 2, 3, 1, 2, 3, 2, 1],
  [2, 3, 1, 3, 2, 3, 1, 2],
  [2, 3, 2, 1, 3, 1, 2, 3],
  [2, 3, 3, 2, 1, 2, 3, 1]
];

/**
 * L27 Orthogonal Array (3^13)
 * 27 runs for up to 13 factors at 3 levels each
 */
const L27_MATRIX = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  [1, 2, 2, 2, 1, 1, 1, 2, 2, 2, 3, 3, 3],
  [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 1, 1, 1],
  [1, 2, 2, 2, 3, 3, 3, 1, 1, 1, 2, 2, 2],
  [1, 3, 3, 3, 1, 1, 1, 3, 3, 3, 2, 2, 2],
  [1, 3, 3, 3, 2, 2, 2, 1, 1, 1, 3, 3, 3],
  [1, 3, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 1],
  [2, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3],
  [2, 1, 2, 3, 2, 3, 1, 2, 3, 1, 2, 3, 1],
  [2, 1, 2, 3, 3, 1, 2, 3, 1, 2, 3, 1, 2],
  [2, 2, 3, 1, 1, 2, 3, 2, 3, 1, 3, 1, 2],
  [2, 2, 3, 1, 2, 3, 1, 3, 1, 2, 1, 2, 3],
  [2, 2, 3, 1, 3, 1, 2, 1, 2, 3, 2, 3, 1],
  [2, 3, 1, 2, 1, 2, 3, 3, 1, 2, 2, 3, 1],
  [2, 3, 1, 2, 2, 3, 1, 1, 2, 3, 3, 1, 2],
  [2, 3, 1, 2, 3, 1, 2, 2, 3, 1, 1, 2, 3],
  [3, 1, 3, 2, 1, 3, 2, 1, 3, 2, 1, 3, 2],
  [3, 1, 3, 2, 2, 1, 3, 2, 1, 3, 2, 1, 3],
  [3, 1, 3, 2, 3, 2, 1, 3, 2, 1, 3, 2, 1],
  [3, 2, 1, 3, 1, 3, 2, 2, 1, 3, 3, 2, 1],
  [3, 2, 1, 3, 2, 1, 3, 3, 2, 1, 1, 3, 2],
  [3, 2, 1, 3, 3, 2, 1, 1, 3, 2, 2, 1, 3],
  [3, 3, 2, 1, 1, 3, 2, 3, 2, 1, 2, 1, 3],
  [3, 3, 2, 1, 2, 1, 3, 1, 3, 2, 3, 2, 1],
  [3, 3, 2, 1, 3, 2, 1, 2, 1, 3, 1, 3, 2]
];

export class TaguchiArrayGenerator {
  /**
   * Generate an L9 orthogonal array
   * @param factors Array of factors (up to 4)
   * @returns TaguchiArray with 9 experimental runs
   */
  static generateL9(factors: Factor[]): TaguchiArray {
    if (factors.length > 4) {
      throw new Error('L9 array supports maximum 4 factors');
    }

    const runs: ExperimentRun[] = [];

    for (let i = 0; i < L9_MATRIX.length; i++) {
      const factorSettings = new Map<string, number>();
      const factorIndices: number[] = [];

      for (let j = 0; j < factors.length; j++) {
        const levelIndex = L9_MATRIX[i][j] - 1; // Convert to 0-based
        factorIndices.push(levelIndex);

        if (factors[j].levels.length < 3) {
          throw new Error(`Factor ${factors[j].name} must have at least 3 levels for L9`);
        }

        factorSettings.set(factors[j].name, factors[j].levels[levelIndex]);
      }

      runs.push({
        runNumber: i + 1,
        factorSettings,
        factorIndices
      });
    }

    return {
      type: 'L9',
      factors,
      runs,
      totalRuns: 9,
      maxFactors: 4,
      levels: 3
    };
  }

  /**
   * Generate an L18 orthogonal array
   * @param factors Array of factors (first can be 2-level, rest 3-level)
   * @returns TaguchiArray with 18 experimental runs
   */
  static generateL18(factors: Factor[]): TaguchiArray {
    if (factors.length > 8) {
      throw new Error('L18 array supports maximum 8 factors');
    }

    const runs: ExperimentRun[] = [];

    for (let i = 0; i < L18_MATRIX.length; i++) {
      const factorSettings = new Map<string, number>();
      const factorIndices: number[] = [];

      for (let j = 0; j < factors.length; j++) {
        const levelIndex = L18_MATRIX[i][j] - 1; // Convert to 0-based
        factorIndices.push(levelIndex);

        // First factor can be 2-level, others must be 3-level
        const requiredLevels = j === 0 ? 2 : 3;
        if (factors[j].levels.length < requiredLevels) {
          throw new Error(`Factor ${factors[j].name} must have at least ${requiredLevels} levels`);
        }

        // Handle 2-level factor in first column
        if (j === 0 && factors[j].levels.length === 2) {
          const adjustedIndex = levelIndex > 0 ? 1 : 0;
          factorSettings.set(factors[j].name, factors[j].levels[adjustedIndex]);
        } else {
          factorSettings.set(factors[j].name, factors[j].levels[levelIndex]);
        }
      }

      runs.push({
        runNumber: i + 1,
        factorSettings,
        factorIndices
      });
    }

    return {
      type: 'L18',
      factors,
      runs,
      totalRuns: 18,
      maxFactors: 8,
      levels: 3
    };
  }

  /**
   * Generate an L27 orthogonal array
   * @param factors Array of factors (up to 13)
   * @returns TaguchiArray with 27 experimental runs
   */
  static generateL27(factors: Factor[]): TaguchiArray {
    if (factors.length > 13) {
      throw new Error('L27 array supports maximum 13 factors');
    }

    const runs: ExperimentRun[] = [];

    for (let i = 0; i < L27_MATRIX.length; i++) {
      const factorSettings = new Map<string, number>();
      const factorIndices: number[] = [];

      for (let j = 0; j < factors.length; j++) {
        const levelIndex = L27_MATRIX[i][j] - 1; // Convert to 0-based
        factorIndices.push(levelIndex);

        if (factors[j].levels.length < 3) {
          throw new Error(`Factor ${factors[j].name} must have at least 3 levels for L27`);
        }

        factorSettings.set(factors[j].name, factors[j].levels[levelIndex]);
      }

      runs.push({
        runNumber: i + 1,
        factorSettings,
        factorIndices
      });
    }

    return {
      type: 'L27',
      factors,
      runs,
      totalRuns: 27,
      maxFactors: 13,
      levels: 3
    };
  }

  /**
   * Automatically select appropriate array based on number of factors
   */
  static generateOptimalArray(factors: Factor[]): TaguchiArray {
    if (factors.length <= 4) {
      return this.generateL9(factors);
    } else if (factors.length <= 8) {
      return this.generateL18(factors);
    } else if (factors.length <= 13) {
      return this.generateL27(factors);
    } else {
      throw new Error('Too many factors for standard Taguchi arrays');
    }
  }

  /**
   * Generate a human-readable experiment matrix
   */
  static formatExperimentMatrix(array: TaguchiArray): string {
    let output = `${array.type} Orthogonal Array\n`;
    output += `${array.totalRuns} runs for ${array.factors.length} factors\n\n`;

    // Header
    output += 'Run | ';
    array.factors.forEach(f => {
      output += `${f.name.padEnd(12)} | `;
    });
    output += '\n';

    // Separator
    output += '----|';
    array.factors.forEach(() => {
      output += '--------------|';
    });
    output += '\n';

    // Data rows
    array.runs.forEach(run => {
      output += `${run.runNumber.toString().padStart(3)} | `;
      array.factors.forEach(factor => {
        const value = run.factorSettings.get(factor.name);
        const formattedValue = `${value}${factor.unit}`;
        output += `${formattedValue.padEnd(12)} | `;
      });
      output += '\n';
    });

    return output;
  }

  /**
   * Export array to CSV format
   */
  static exportToCSV(array: TaguchiArray): string {
    let csv = 'Run Number';

    // Header
    array.factors.forEach(f => {
      csv += `,${f.name} (${f.unit})`;
    });
    csv += '\n';

    // Data rows
    array.runs.forEach(run => {
      csv += run.runNumber;
      array.factors.forEach(factor => {
        csv += `,${run.factorSettings.get(factor.name)}`;
      });
      csv += '\n';
    });

    return csv;
  }
}

// Example preset factor configurations for 3D printing
export const PRESET_FACTORS = {
  temperature: (min: number, mid: number, max: number): Factor => ({
    name: 'Temperature',
    parameter: 'temperature',
    levels: [min, mid, max],
    unit: '°C',
    description: 'Nozzle temperature'
  }),

  fanSpeed: (min: number, mid: number, max: number): Factor => ({
    name: 'Fan Speed',
    parameter: 'fan_speed',
    levels: [min, mid, max],
    unit: '%',
    description: 'Cooling fan speed'
  }),

  printSpeed: (min: number, mid: number, max: number): Factor => ({
    name: 'Print Speed',
    parameter: 'print_speed',
    levels: [min, mid, max],
    unit: 'mm/s',
    description: 'Print movement speed'
  }),

  layerHeight: (min: number, mid: number, max: number): Factor => ({
    name: 'Layer Height',
    parameter: 'layer_height',
    levels: [min, mid, max],
    unit: 'mm',
    description: 'Layer thickness'
  }),

  flowRatio: (min: number, mid: number, max: number): Factor => ({
    name: 'Flow Ratio',
    parameter: 'flow_ratio',
    levels: [min, mid, max],
    unit: '',
    description: 'Extrusion multiplier'
  }),

  retractionDistance: (min: number, mid: number, max: number): Factor => ({
    name: 'Retraction',
    parameter: 'retraction_distance',
    levels: [min, mid, max],
    unit: 'mm',
    description: 'Retraction distance'
  })
};