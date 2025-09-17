/**
 * DOE Experiment Planner
 *
 * Generates complete experiment sets with 3MF files for each run
 */

import { TaguchiArrayGenerator, Factor } from './taguchiArrays';
import {
  DOEExperiment,
  TestModelType,
  ExperimentRun,
  ExperimentFile,
  ExperimentFactor
} from './doeTypes';
import { TEST_MODELS } from './testModels';
import { generate3MF } from '../orca3mfExporter';
import { parseSTL, ParsedSTL } from '../asciiStlUtils';

// Map factors to OrcaSlicer settings
const FACTOR_TO_ORCA_SETTINGS: Record<string, string> = {
  temperature: 'nozzle_temperature',
  fan_speed: 'fan_speed',
  print_speed: 'outer_wall_speed',
  layer_height: 'layer_height',
  flow_ratio: 'flow_ratio',
  retraction_distance: 'retraction_length',
  retraction_speed: 'retraction_speed',
  pressure_advance: 'pressure_advance'
};

export class ExperimentPlanner {
  private experiment: DOEExperiment;
  private baseSTL?: ParsedSTL;

  constructor(
    name: string,
    description: string,
    arrayType: 'L9' | 'L18' | 'L27',
    testModel: TestModelType,
    factors: ExperimentFactor[]
  ) {
    // Create the experiment
    this.experiment = {
      id: `doe_${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      arrayType,
      testModel,
      factors,
      runs: [],
      status: 'planned'
    };

    // Generate the orthogonal array
    this.generateExperimentRuns();
  }

  /**
   * Generate experimental runs based on the selected array type
   */
  private generateExperimentRuns(): void {
    // Convert to Factor format for Taguchi generator
    const taguchiFactors: Factor[] = this.experiment.factors.map(f => ({
      name: f.name,
      parameter: f.parameter,
      levels: f.levels,
      unit: f.unit,
      description: f.description
    }));

    // Generate the array
    let array;
    switch (this.experiment.arrayType) {
      case 'L9':
        array = TaguchiArrayGenerator.generateL9(taguchiFactors);
        break;
      case 'L18':
        array = TaguchiArrayGenerator.generateL18(taguchiFactors);
        break;
      case 'L27':
        array = TaguchiArrayGenerator.generateL27(taguchiFactors);
        break;
    }

    // Convert to experiment runs
    this.experiment.runs = array.runs.map(run => ({
      runNumber: run.runNumber,
      factorSettings: Object.fromEntries(run.factorSettings),
      completed: false
    }));
  }

  /**
   * Load the base STL file for the test model
   */
  private async loadBaseSTL(): Promise<void> {
    const testModel = TEST_MODELS[this.experiment.testModel];
    const response = await fetch(testModel.stlFile);

    if (!response.ok) {
      throw new Error(`Failed to load STL file: ${testModel.stlFile}`);
    }

    const stlContent = await response.text();
    this.baseSTL = parseSTL(stlContent);
  }

  /**
   * Generate a 3MF file for a specific run
   */
  private async generate3MFForRun(run: ExperimentRun): Promise<Blob> {
    if (!this.baseSTL) {
      await this.loadBaseSTL();
    }

    // Create OrcaSlicer settings from factor settings
    const orcaSettings: Record<string, any> = {};

    for (const [factorName, value] of Object.entries(run.factorSettings)) {
      const factor = this.experiment.factors.find(f => f.name === factorName);
      if (factor && factor.slicerSetting) {
        orcaSettings[factor.slicerSetting] = value;
      } else if (FACTOR_TO_ORCA_SETTINGS[factor?.parameter || '']) {
        orcaSettings[FACTOR_TO_ORCA_SETTINGS[factor.parameter]] = value;
      }
    }

    // Add default settings for consistent slicing
    const defaultSettings = {
      layer_height: 0.2,
      initial_layer_height: 0.2,
      line_width: 0.42,
      wall_loops: 2,
      top_shell_layers: 4,
      bottom_shell_layers: 3,
      sparse_infill_density: 20,
      infill_pattern: 'grid',
      print_sequence: 'by layer',
      ...orcaSettings // Override with experiment settings
    };

    // Generate the 3MF project
    const projectName = `${this.experiment.name}_Run${run.runNumber}`;
    const modelName = TEST_MODELS[this.experiment.testModel].name;

    const threemfBlob = await generate3MF(
      this.baseSTL!,
      defaultSettings,
      {
        projectName,
        modelName,
        metadata: {
          experiment_id: this.experiment.id,
          run_number: run.runNumber,
          factors: JSON.stringify(run.factorSettings),
          created: new Date().toISOString()
        }
      }
    );

    return threemfBlob;
  }

  /**
   * Generate all 3MF files for the experiment
   */
  async generateAll3MFFiles(): Promise<ExperimentFile[]> {
    const files: ExperimentFile[] = [];

    // Ensure we have the base STL loaded
    await this.loadBaseSTL();

    for (const run of this.experiment.runs) {
      try {
        const blob = await this.generate3MFForRun(run);

        // Create filename with clear labeling
        const filename = this.generateFilename(run);

        // Create file record
        const file: ExperimentFile = {
          filename,
          path: `/experiments/${this.experiment.id}/${filename}`,
          type: '3mf',
          parameters: run.factorSettings,
          generated: true
        };

        // Store the blob URL for download
        file.downloadUrl = URL.createObjectURL(blob);

        // Add to run
        run.testFile = file;
        files.push(file);

      } catch (error) {
        console.error(`Failed to generate 3MF for run ${run.runNumber}:`, error);

        // Mark as not generated
        const file: ExperimentFile = {
          filename: this.generateFilename(run),
          path: '',
          type: '3mf',
          parameters: run.factorSettings,
          generated: false
        };

        run.testFile = file;
        files.push(file);
      }
    }

    this.experiment.status = 'in-progress';
    return files;
  }

  /**
   * Generate a descriptive filename for an experimental run
   */
  private generateFilename(run: ExperimentRun): string {
    const parts = [`DOE_${this.experiment.arrayType}_Run${run.runNumber.toString().padStart(2, '0')}`];

    // Add abbreviated factor values
    for (const [factorName, value] of Object.entries(run.factorSettings)) {
      const factor = this.experiment.factors.find(f => f.name === factorName);
      if (factor) {
        const abbrev = this.abbreviateFactor(factor.parameter);
        const formattedValue = this.formatValue(value, factor.unit);
        parts.push(`${abbrev}${formattedValue}`);
      }
    }

    return parts.join('_') + '.3mf';
  }

  /**
   * Abbreviate factor names for filenames
   */
  private abbreviateFactor(parameter: string): string {
    const abbreviations: Record<string, string> = {
      temperature: 'T',
      fan_speed: 'F',
      print_speed: 'S',
      layer_height: 'L',
      flow_ratio: 'FL',
      retraction_distance: 'R',
      pressure_advance: 'PA'
    };
    return abbreviations[parameter] || parameter.substring(0, 2).toUpperCase();
  }

  /**
   * Format values for filenames
   */
  private formatValue(value: number, unit: string): string {
    // Remove decimals for cleaner filenames where appropriate
    if (unit === '°C' || unit === '%' || unit === 'mm/s') {
      return Math.round(value).toString();
    } else if (unit === 'mm') {
      // Keep one decimal for mm values
      return value.toFixed(1).replace('.', '');
    } else {
      return value.toString().replace('.', '');
    }
  }

  /**
   * Export the experiment design to CSV
   */
  exportToCSV(): string {
    let csv = 'Run Number';

    // Header
    this.experiment.factors.forEach(f => {
      csv += `,${f.name} (${f.unit})`;
    });
    csv += ',File Name\n';

    // Data rows
    this.experiment.runs.forEach(run => {
      csv += run.runNumber;
      this.experiment.factors.forEach(factor => {
        csv += `,${run.factorSettings[factor.name]}`;
      });
      csv += `,${run.testFile?.filename || 'Not generated'}`;
      csv += '\n';
    });

    return csv;
  }

  /**
   * Get a formatted summary of the experiment
   */
  getSummary(): string {
    const testModel = TEST_MODELS[this.experiment.testModel];
    let summary = `Experiment: ${this.experiment.name}\n`;
    summary += `Description: ${this.experiment.description}\n`;
    summary += `Array Type: ${this.experiment.arrayType} (${this.experiment.runs.length} runs)\n`;
    summary += `Test Model: ${testModel.name}\n`;
    summary += `Estimated Total Print Time: ${testModel.printTime * this.experiment.runs.length} minutes\n\n`;

    summary += 'Factors:\n';
    this.experiment.factors.forEach(factor => {
      summary += `  - ${factor.name}: ${factor.levels.join(', ')} ${factor.unit}\n`;
    });

    return summary;
  }

  /**
   * Get the experiment object
   */
  getExperiment(): DOEExperiment {
    return this.experiment;
  }

  /**
   * Create a batch download for all generated files
   */
  async createBatchDownload(): Promise<{ blob: Blob; filename: string }> {
    // This would ideally create a ZIP file with all 3MF files
    // For now, we'll return a CSV with the experiment design
    const csv = this.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const filename = `${this.experiment.name}_design.csv`;

    return { blob, filename };
  }
}

// Example usage function
export async function createBasicPLAExperiment(): Promise<ExperimentPlanner> {
  const factors: ExperimentFactor[] = [
    {
      name: 'Temperature',
      parameter: 'temperature',
      levels: [190, 205, 220],
      unit: '°C',
      slicerSetting: 'nozzle_temperature'
    },
    {
      name: 'Fan Speed',
      parameter: 'fan_speed',
      levels: [50, 75, 100],
      unit: '%',
      slicerSetting: 'fan_speed'
    },
    {
      name: 'Print Speed',
      parameter: 'print_speed',
      levels: [40, 60, 80],
      unit: 'mm/s',
      slicerSetting: 'outer_wall_speed'
    },
    {
      name: 'Layer Height',
      parameter: 'layer_height',
      levels: [0.1, 0.2, 0.3],
      unit: 'mm',
      slicerSetting: 'layer_height'
    }
  ];

  const planner = new ExperimentPlanner(
    'PLA Basic Calibration',
    'L9 experiment to optimize basic PLA printing parameters',
    'L9',
    'calibration_cube',
    factors
  );

  // Generate all 3MF files
  await planner.generateAll3MFFiles();

  return planner;
}