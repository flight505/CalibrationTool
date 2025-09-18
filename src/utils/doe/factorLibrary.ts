import { ExperimentFactor, TemplateFactorConfig } from './doeTypes';

export interface FactorPreset {
  id: string;
  name: string;
  parameter: string;
  unit: string;
  defaultLevels: number[];
  description: string;
  slicerSetting?: string;
}

export const FACTOR_LIBRARY: Record<string, FactorPreset> = {
  temperature: {
    id: 'temperature',
    name: 'Nozzle Temperature',
    parameter: 'temperature',
    unit: '°C',
    defaultLevels: [190, 205, 220],
    description: 'Extruder temperature affecting flow and adhesion',
    slicerSetting: 'nozzle_temperature'
  },
  fan_speed: {
    id: 'fan_speed',
    name: 'Cooling Fan Speed',
    parameter: 'fan_speed',
    unit: '%',
    defaultLevels: [40, 70, 100],
    description: 'Part cooling fan percentage',
    slicerSetting: 'fan_speed'
  },
  print_speed: {
    id: 'print_speed',
    name: 'Print Speed',
    parameter: 'print_speed',
    unit: 'mm/s',
    defaultLevels: [40, 60, 80],
    description: 'Outer wall print speed',
    slicerSetting: 'outer_wall_speed'
  },
  layer_height: {
    id: 'layer_height',
    name: 'Layer Height',
    parameter: 'layer_height',
    unit: 'mm',
    defaultLevels: [0.12, 0.2, 0.28],
    description: 'Layer height impacts surface and print time',
    slicerSetting: 'layer_height'
  },
  flow_ratio: {
    id: 'flow_ratio',
    name: 'Flow Ratio',
    parameter: 'flow_ratio',
    unit: '',
    defaultLevels: [0.95, 1.0, 1.05],
    description: 'Extrusion multiplier in ratio form',
    slicerSetting: 'filament_flow_ratio'
  },
  retraction: {
    id: 'retraction',
    name: 'Retraction Distance',
    parameter: 'retraction_distance',
    unit: 'mm',
    defaultLevels: [0.4, 0.6, 0.8],
    description: 'Retraction pull-back distance',
    slicerSetting: 'retraction_length'
  },
  pressure_advance: {
    id: 'pressure_advance',
    name: 'Pressure Advance',
    parameter: 'pressure_advance',
    unit: '',
    defaultLevels: [0.01, 0.05, 0.1],
    description: 'Extruder pressure advance / linear advance value',
    slicerSetting: 'pressure_advance'
  }
};

export function createFactorFromPreset(
  presetId: string,
  overrideLevels?: number[]
): ExperimentFactor | null {
  const preset = FACTOR_LIBRARY[presetId];
  if (!preset) {
    return null;
  }

  return {
    name: preset.name,
    parameter: preset.parameter,
    levels: overrideLevels && overrideLevels.length ? overrideLevels : preset.defaultLevels,
    unit: preset.unit,
    description: preset.description,
    slicerSetting: preset.slicerSetting
  };
}

export function expandTemplateFactor(config: TemplateFactorConfig): ExperimentFactor | null {
  return createFactorFromPreset(config.factorType, config.defaultLevels);
}
