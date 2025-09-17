/**
 * Test Model Definitions for DOE
 *
 * Defines all available test models, their metrics, and scoring rubrics
 */

import { TestModel, TestMetric, TestModelType } from './doeTypes';

// Calibration Cube - Dimensional Accuracy
export const CALIBRATION_CUBE: TestModel = {
  id: 'calibration_cube',
  name: '20mm Calibration Cube',
  description: 'Tests dimensional accuracy in X, Y, and Z axes',
  stlFile: '/templates/doe/calibration_cube.stl',
  printTime: 15, // minutes
  metrics: [
    {
      id: 'x_dimension',
      name: 'X Dimension',
      description: 'Measured X axis dimension',
      measurementType: 'numeric',
      responseType: 'nominal-is-best',
      unit: 'mm',
      target: 20.00,
      minValue: 19.00,
      maxValue: 21.00
    },
    {
      id: 'y_dimension',
      name: 'Y Dimension',
      description: 'Measured Y axis dimension',
      measurementType: 'numeric',
      responseType: 'nominal-is-best',
      unit: 'mm',
      target: 20.00,
      minValue: 19.00,
      maxValue: 21.00
    },
    {
      id: 'z_dimension',
      name: 'Z Dimension',
      description: 'Measured Z axis dimension',
      measurementType: 'numeric',
      responseType: 'nominal-is-best',
      unit: 'mm',
      target: 20.00,
      minValue: 19.00,
      maxValue: 21.00
    },
    {
      id: 'corner_quality',
      name: 'Corner Quality',
      description: 'Sharpness of cube corners',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Perfect sharp corners, no bulging or rounding',
        score4: 'Slight corner rounding, minimal bulging',
        score3: 'Noticeable corner rounding, some bulging',
        score2: 'Significant corner issues, obvious bulging',
        score1: 'Severe corner deformation, blobs present'
      }
    }
  ]
};

// Bridge Test Array
export const BRIDGE_ARRAY: TestModel = {
  id: 'bridge_array',
  name: 'Bridge Test Array',
  description: 'Tests bridging capability at different spans',
  stlFile: '/templates/doe/bridge_array.stl',
  printTime: 20,
  metrics: [
    {
      id: 'successful_bridges',
      name: 'Successful Bridges',
      description: 'Count of bridges without significant sag',
      measurementType: 'count',
      responseType: 'larger-is-better',
      minValue: 0,
      maxValue: 5
    },
    {
      id: 'max_bridge_length',
      name: 'Maximum Bridge Length',
      description: 'Longest successful bridge span',
      measurementType: 'numeric',
      responseType: 'larger-is-better',
      unit: 'mm',
      minValue: 0,
      maxValue: 25
    },
    {
      id: 'bridge_quality',
      name: 'Bridge Quality',
      description: 'Overall bridge surface quality',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Perfect bridges, no sag, smooth underside',
        score4: 'Minimal sag (<1mm), good surface',
        score3: 'Moderate sag (1-2mm), acceptable surface',
        score2: 'Significant sag (2-3mm), rough surface',
        score1: 'Bridge failure or severe sag (>3mm)'
      }
    }
  ]
};

// Overhang Test
export const OVERHANG_TEST: TestModel = {
  id: 'overhang_test',
  name: 'Progressive Overhang Test',
  description: 'Tests overhang capability at increasing angles',
  stlFile: '/templates/doe/overhang_test.stl',
  printTime: 25,
  metrics: [
    {
      id: 'max_overhang_angle',
      name: 'Maximum Overhang Angle',
      description: 'Steepest angle printed successfully',
      measurementType: 'numeric',
      responseType: 'larger-is-better',
      unit: '°',
      minValue: 30,
      maxValue: 80
    },
    {
      id: 'overhang_quality',
      name: 'Overhang Surface Quality',
      description: 'Surface finish of overhang sections',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Clean surface to 70°+, no drooping',
        score4: 'Clean to 60°, minimal drooping',
        score3: 'Clean to 50°, some drooping',
        score2: 'Clean to 45°, significant drooping',
        score1: 'Only 30° acceptable, severe issues'
      }
    }
  ]
};

// Clearance/Tolerance Test
export const CLEARANCE_TEST: TestModel = {
  id: 'clearance_test',
  name: 'Clearance Tolerance Test',
  description: 'Tests minimum functional clearance for holes and pins',
  stlFile: '/templates/doe/clearance_test.stl',
  printTime: 15,
  metrics: [
    {
      id: 'min_clearance',
      name: 'Minimum Clearance',
      description: 'Smallest gap that remains free',
      measurementType: 'numeric',
      responseType: 'smaller-is-better',
      unit: 'mm',
      minValue: 0.1,
      maxValue: 0.5
    },
    {
      id: 'hole_accuracy',
      name: 'Hole Dimensional Accuracy',
      description: 'Deviation from nominal hole size',
      measurementType: 'numeric',
      responseType: 'smaller-is-better',
      unit: 'mm',
      minValue: 0,
      maxValue: 0.5
    }
  ]
};

// Surface Quality Patch
export const SURFACE_PATCH: TestModel = {
  id: 'surface_patch',
  name: 'Surface Quality Test Patch',
  description: 'Tests top surface finish quality',
  stlFile: '/templates/doe/surface_patch.stl',
  printTime: 10,
  metrics: [
    {
      id: 'surface_roughness',
      name: 'Surface Roughness',
      description: 'Top surface finish quality',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Glass smooth, no visible layer lines',
        score4: 'Minor layer lines visible',
        score3: 'Visible layer lines, acceptable finish',
        score2: 'Rough surface, prominent layer lines',
        score1: 'Failed surface, gaps or severe roughness'
      }
    },
    {
      id: 'surface_uniformity',
      name: 'Surface Uniformity',
      description: 'Consistency across the surface',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Perfectly uniform across entire surface',
        score4: 'Mostly uniform, minor variations',
        score3: 'Some inconsistency, acceptable overall',
        score2: 'Significant variations in quality',
        score1: 'Severe inconsistency, patches of failure'
      }
    }
  ]
};

// Existing tower tests adapted for DOE
export const TEMPERATURE_TOWER_TEST: TestModel = {
  id: 'temperature_tower',
  name: 'Temperature Tower',
  description: 'Tests optimal temperature for layer adhesion and quality',
  stlFile: '/templates/temp_tower_ascii.stl',
  printTime: 30,
  metrics: [
    {
      id: 'optimal_temp',
      name: 'Optimal Temperature',
      description: 'Best temperature for overall quality',
      measurementType: 'numeric',
      responseType: 'nominal-is-best',
      unit: '°C',
      target: 210, // Default for PLA
      minValue: 180,
      maxValue: 250
    },
    {
      id: 'layer_adhesion',
      name: 'Layer Adhesion Strength',
      description: 'Strength of layer bonding',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'Excellent adhesion, no separation',
        score4: 'Good adhesion, minimal weakness',
        score3: 'Adequate adhesion, some weak spots',
        score2: 'Poor adhesion, easily separated',
        score1: 'Failed adhesion, layers delaminating'
      }
    }
  ]
};

export const RETRACTION_TOWER_TEST: TestModel = {
  id: 'retraction_tower',
  name: 'Retraction Tower',
  description: 'Tests retraction settings to minimize stringing',
  stlFile: '/templates/retraction_tower_orca_ascii.stl',
  printTime: 20,
  metrics: [
    {
      id: 'string_count',
      name: 'String Count',
      description: 'Number of visible strings between pillars',
      measurementType: 'count',
      responseType: 'smaller-is-better',
      minValue: 0,
      maxValue: 20
    },
    {
      id: 'stringing_severity',
      name: 'Stringing Severity',
      description: 'Overall stringing assessment',
      measurementType: 'score',
      responseType: 'larger-is-better',
      minValue: 1,
      maxValue: 5,
      scoringRubric: {
        score5: 'No stringing, perfectly clean',
        score4: '1-2 thin wisps',
        score3: '3-5 strings, manageable',
        score2: '6-10 strings, problematic',
        score1: 'Severe stringing, >10 strings'
      }
    }
  ]
};

// Collection of all test models
export const TEST_MODELS: Record<TestModelType, TestModel> = {
  calibration_cube: CALIBRATION_CUBE,
  bridge_array: BRIDGE_ARRAY,
  overhang_test: OVERHANG_TEST,
  clearance_test: CLEARANCE_TEST,
  surface_patch: SURFACE_PATCH,
  temperature_tower: TEMPERATURE_TOWER_TEST,
  retraction_tower: RETRACTION_TOWER_TEST,
  flow_tower: {
    id: 'flow_tower',
    name: 'Flow Tower',
    description: 'Tests flow ratio for dimensional accuracy',
    stlFile: '/templates/flow_tower_ascii.stl',
    printTime: 25,
    metrics: []
  },
  fan_tower: {
    id: 'fan_tower',
    name: 'Fan Speed Tower',
    description: 'Tests cooling fan effects',
    stlFile: '/templates/fan_tower_ascii.stl',
    printTime: 25,
    metrics: []
  },
  speed_tower: {
    id: 'speed_tower',
    name: 'Speed Tower',
    description: 'Tests print speed limits',
    stlFile: '/templates/speed_tower_ascii.stl',
    printTime: 20,
    metrics: []
  },
  pressure_advance: {
    id: 'pressure_advance',
    name: 'Pressure Advance Pattern',
    description: 'Tests pressure advance calibration',
    stlFile: '/templates/pa_pattern_ascii.stl',
    printTime: 15,
    metrics: []
  }
};

// Preset experiment templates for common scenarios
export const DOE_TEMPLATES = {
  basic_pla_tuning: {
    id: 'basic_pla_tuning',
    name: 'Basic PLA Tuning (L9)',
    description: 'Quick 9-run experiment for PLA optimization',
    arrayType: 'L9' as const,
    factors: [
      { factorType: 'temperature' as const, defaultLevels: [190, 205, 220], recommended: true },
      { factorType: 'fan_speed' as const, defaultLevels: [50, 75, 100], recommended: true },
      { factorType: 'print_speed' as const, defaultLevels: [40, 60, 80], recommended: true },
      { factorType: 'layer_height' as const, defaultLevels: [0.1, 0.2, 0.3], recommended: false }
    ],
    testModel: 'calibration_cube' as TestModelType,
    material: 'PLA'
  },

  advanced_quality_optimization: {
    id: 'advanced_quality_optimization',
    name: 'Advanced Quality Optimization (L18)',
    description: 'Comprehensive 18-run experiment for print quality',
    arrayType: 'L18' as const,
    factors: [
      { factorType: 'temperature' as const, defaultLevels: [195, 210, 225], recommended: true },
      { factorType: 'fan_speed' as const, defaultLevels: [30, 65, 100], recommended: true },
      { factorType: 'print_speed' as const, defaultLevels: [30, 50, 70], recommended: true },
      { factorType: 'layer_height' as const, defaultLevels: [0.12, 0.2, 0.28], recommended: true },
      { factorType: 'flow_ratio' as const, defaultLevels: [0.95, 1.0, 1.05], recommended: true },
      { factorType: 'retraction' as const, defaultLevels: [0.4, 0.6, 0.8], recommended: true }
    ],
    testModel: 'bridge_array' as TestModelType,
    material: 'PETG'
  }
};