/**
 * DOE (Design of Experiments) Type Definitions
 *
 * Core types and interfaces for the DOE calibration system
 */

// Test model types that can be used in experiments
export type TestModelType =
  | 'calibration_cube'
  | 'bridge_array'
  | 'overhang_test'
  | 'clearance_test'
  | 'surface_patch'
  | 'temperature_tower'
  | 'flow_tower'
  | 'retraction_tower'
  | 'fan_tower'
  | 'speed_tower'
  | 'pressure_advance';

// Measurement types for scoring
export type MeasurementType = 'numeric' | 'count' | 'score' | 'boolean';

// Response types (optimization goals)
export type ResponseType = 'larger-is-better' | 'smaller-is-better' | 'nominal-is-best';

export interface TestModel {
  id: TestModelType;
  name: string;
  description: string;
  stlFile: string;
  printTime: number; // Estimated print time in minutes
  metrics: TestMetric[];
}

export interface TestMetric {
  id: string;
  name: string;
  description: string;
  measurementType: MeasurementType;
  responseType: ResponseType;
  unit?: string;
  target?: number; // For nominal-is-best
  minValue?: number;
  maxValue?: number;
  scoringRubric?: ScoringRubric;
}

export interface ScoringRubric {
  score5: string;
  score4: string;
  score3: string;
  score2: string;
  score1: string;
  referenceImages?: string[]; // URLs to reference images
}

export interface DOEExperiment {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  arrayType: 'L9' | 'L18' | 'L27';
  testModel: TestModelType;
  factors: ExperimentFactor[];
  runs: ExperimentRun[];
  results?: ExperimentResults;
  status: 'planned' | 'in-progress' | 'completed' | 'analyzed';
}

export interface ExperimentFactor {
  name: string;
  parameter: string;
  levels: number[];
  unit: string;
  description?: string;
  slicerSetting?: string; // Corresponding OrcaSlicer setting key
}

export interface ExperimentRun {
  runNumber: number;
  factorSettings: Record<string, number>;
  testFile?: ExperimentFile;
  measurements?: Record<string, number>;
  notes?: string;
  completed: boolean;
}

export interface ExperimentFile {
  filename: string;
  path: string;
  type: '3mf' | 'gcode' | 'stl';
  parameters: Record<string, any>;
  generated: boolean;
  downloadUrl?: string;
}

export interface ExperimentResults {
  mainEffects: MainEffectAnalysis[];
  signalToNoise: SNRAnalysis[];
  optimalSettings: Record<string, number>;
  predictedResponse: number;
  confirmationRun?: ConfirmationRun;
}

export interface MainEffectAnalysis {
  factor: string;
  levels: number[];
  means: number[];
  effect: number; // Max mean - Min mean
}

export interface SNRAnalysis {
  factor: string;
  levels: number[];
  snrValues: number[];
  optimalLevel: number;
}

export interface ConfirmationRun {
  settings: Record<string, number>;
  predictedValue: number;
  actualValue?: number;
  improvement: number; // Percentage improvement
}

// Preset experiment templates for common scenarios
export interface ExperimentTemplate {
  id: string;
  name: string;
  description: string;
  arrayType: 'L9' | 'L18' | 'L27';
  factors: TemplateFactorConfig[];
  testModel: TestModelType;
  material?: string;
  printerType?: string;
}

export interface TemplateFactorConfig {
  factorType: 'temperature' | 'fan_speed' | 'print_speed' | 'layer_height' | 'flow_ratio' | 'retraction';
  defaultLevels: number[];
  recommended: boolean;
}

// Statistical analysis functions
export interface DOEAnalysis {
  calculateMainEffects(data: ExperimentRun[]): MainEffectAnalysis[];
  calculateSNR(data: ExperimentRun[], responseType: ResponseType): SNRAnalysis[];
  predictOptimal(mainEffects: MainEffectAnalysis[]): Record<string, number>;
  calculateANOVA(data: ExperimentRun[]): ANOVATable;
}

export interface ANOVATable {
  sources: ANOVASource[];
  totalSS: number;
  totalDF: number;
}

export interface ANOVASource {
  name: string;
  sumOfSquares: number;
  degreesOfFreedom: number;
  meanSquare: number;
  fValue?: number;
  contribution: number; // Percentage contribution
}

// Export formats for experiment data
export interface ExperimentExport {
  toCSV(): string;
  toJSON(): string;
  toOrcaProfile(): string; // OrcaSlicer profile format
  toReport(): ExperimentReport;
}

export interface ExperimentReport {
  summary: string;
  methodology: string;
  results: string;
  recommendations: string;
  charts: ChartData[];
}

export interface ChartData {
  type: 'line' | 'bar' | 'scatter';
  title: string;
  xLabel: string;
  yLabel: string;
  data: any[];
}