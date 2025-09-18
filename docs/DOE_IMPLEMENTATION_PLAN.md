# DOE Implementation Plan - CalibrationTool

## Executive Summary

This document outlines the actionable implementation plan for integrating Design of Experiments (DOE) methodology into the CalibrationTool application. The goal is to transform the application from a single-parameter calibration tool into a comprehensive multi-factor optimization platform using statistical experimental design.

## Core Objectives

1. **Systematic Multi-Factor Optimization**: Move beyond single-parameter testing to understand factor interactions
2. **Data-Driven Calibration**: Replace trial-and-error with statistically sound experimental design
3. **Quantifiable Quality Metrics**: Implement objective scoring systems for print quality assessment
4. **Automated G-code Generation**: Create test files with parameter variations for efficient batch testing

### Asset Workflow Alignment (Update — 2025-02-14)

- All *design assets* are maintained as ASCII STL sources under `public/templates/doe/`
- The DOE planner converts those STL sources into Orca-compatible 3MF projects on-demand, embedding modifier settings and metadata
- New geometry work should target STL first; no manual 3MF authoring is required beyond the automated export path

## Phase 1: DOE Framework Implementation

### 1.1 Taguchi Orthogonal Array Generator
**Timeline: Week 1-2**

#### Technical Requirements
```typescript
interface TaguchiArray {
  type: 'L9' | 'L18' | 'L27';
  factors: Factor[];
  levels: number;
  runs: ExperimentRun[];
}

interface Factor {
  name: string;
  parameter: string; // G-code parameter
  levels: number[];  // Values to test
  unit: string;
}

interface ExperimentRun {
  runNumber: number;
  factorSettings: Map<string, number>;
  testModel: string;
  gcodePath: string;
}
```

#### Implementation Tasks
- [ ] Create `src/utils/doe/taguchiGenerator.ts`
  - L9 array (4 factors, 3 levels, 9 runs)
  - L18 array (7 factors, mixed levels)
  - L27 array (13 factors, 3 levels)
- [ ] Build factor selection UI component
- [ ] Generate experiment matrix display
- [ ] Export experiment design to CSV/JSON

### 1.2 Response Surface Methodology (RSM) Designer
**Timeline: Week 2-3**

#### Components
- [ ] Central Composite Design (CCD) generator
- [ ] Box-Behnken Design generator
- [ ] Face-Centered Composite Design option
- [ ] Fractional factorial designs for screening

#### Implementation
```typescript
interface RSMDesign {
  type: 'CCD' | 'BoxBehnken' | 'FaceCentered';
  centerPoints: number;
  axialPoints: boolean;
  factors: ContinuousFactor[];
  runs: RSMRun[];
}

interface ContinuousFactor extends Factor {
  low: number;
  high: number;
  center: number;
  alpha?: number; // For axial points
}
```

### 1.3 Parameter Variation System
**Timeline: Week 3-4**

#### G-code Generation Architecture
```typescript
interface ParameterVariation {
  layerHeight?: number;
  temperature?: number;
  fanSpeed?: number;
  flowRatio?: number;
  printSpeed?: number;
  retraction?: RetractionSettings;
  pressureAdvance?: number;
}

class DOEGcodeGenerator {
  generateExperimentSet(
    design: TaguchiArray | RSMDesign,
    baseGcode: string,
    testModel: TestModel
  ): ExperimentFile[] {
    // Generate individual G-code files for each run
    // Embed parameter changes at appropriate layers
    // Include metadata for tracking
  }
}
```

#### Features
- [ ] Multi-parameter G-code injection
- [ ] Layer-based parameter transitions
- [ ] Metadata embedding (QR codes, run numbers)
- [ ] Batch file generation with naming convention
- [ ] OrcaSlicer project file generation per run

## Phase 2: Test Models & Metrics System

### 2.1 Standard Test Model Library
**Timeline: Week 4-5**

#### Required Test Models
```typescript
enum TestModelType {
  BENCHY = 'benchy',                    // Overall quality
  CALIBRATION_CUBE = 'calibration_cube', // Dimensional accuracy
  OVERHANG_TEST = 'overhang_test',      // Cooling/bridging
  STRINGING_TEST = 'stringing_test',    // Retraction
  BRIDGE_TEST = 'bridge_test',          // Bridging performance
  THIN_WALL = 'thin_wall',              // Flow precision
  TEMPERATURE_TOWER = 'temp_tower',     // Layer adhesion
  SURFACE_FINISH = 'surface_test',      // Surface quality
  CORNER_TEST = 'corner_test',          // Pressure advance
  DIMENSIONAL_TEST = 'dimensional'       // Accuracy
}

interface TestModel {
  type: TestModelType;
  stlPath: string;
  metrics: QualityMetric[];
  scoringRubric: ScoringRubric;
  printTime: number; // Estimated minutes
  filamentUsage: number; // Grams
}
```

#### Test Model Sources
- [ ] Import existing calibration models from current tool
- [ ] Create missing models:
  - [ ] Standard 3DBenchy (existing STL)
  - [x] XYZ calibration cube (20mm) — generated procedurally (`scripts/generate-doe-models.js`)
  - [x] Overhang test (30-80 degrees) — generated procedurally
  - [ ] Stringing torture test
  - [x] Bridge test array — generated procedurally
  - [ ] Thin wall test (0.4-1.2mm)
  - [x] Surface quality patch — generated procedurally
  - [ ] Corner sharpness test

### 2.2 Quantifiable Scoring System
**Timeline: Week 5-6**

#### Metric Categories
```typescript
interface QualityMetric {
  id: string;
  name: string;
  category: MetricCategory;
  measurementType: 'visual' | 'dimensional' | 'weight' | 'count';
  scale: ScaleType;
  weight: number; // Importance factor
}

enum MetricCategory {
  DIMENSIONAL_ACCURACY = 'dimensional',
  SURFACE_QUALITY = 'surface',
  OVERHANG_PERFORMANCE = 'overhang',
  BRIDGING = 'bridging',
  STRINGING = 'stringing',
  LAYER_ADHESION = 'adhesion',
  CORNER_SHARPNESS = 'corners',
  FIRST_LAYER = 'first_layer'
}

interface ScaleType {
  type: 'likert' | 'percentage' | 'millimeters' | 'count';
  min: number;
  max: number;
  optimal: number;
}
```

#### Scoring Rubrics
```typescript
interface ScoringRubric {
  testModel: TestModelType;
  metrics: RubricItem[];
  totalScore: number;
  passingScore: number;
}

interface RubricItem {
  metric: QualityMetric;
  description: string;
  scoringGuide: ScoreLevel[];
  images?: string[]; // Reference images
}

interface ScoreLevel {
  score: number;
  description: string;
  visualExample?: string; // Image path
}
```

### 2.3 Measurement Guidance System
**Timeline: Week 6**

#### Interactive Measurement Guide
- [ ] Step-by-step measurement instructions
- [ ] Visual overlays on test model images
- [ ] Caliper usage animations
- [ ] Common measurement errors to avoid
- [ ] Automatic score calculation

## Phase 3: Experiment Execution Interface

### 3.1 Experiment Management Dashboard
**Timeline: Week 7-8**

#### Components
```typescript
interface ExperimentSession {
  id: string;
  name: string;
  design: TaguchiArray | RSMDesign;
  status: 'planning' | 'printing' | 'measuring' | 'complete';
  runs: ExperimentRun[];
  results: RunResult[];
  analysis?: StatisticalAnalysis;
}

interface RunResult {
  runId: string;
  printDate: Date;
  scores: Map<string, number>;
  photos?: string[];
  notes?: string;
  printTime: number;
  filamentUsed: number;
  failures?: PrintFailure[];
}
```

#### UI Features
- [ ] Experiment creation wizard
- [ ] Run tracking checklist
- [ ] QR code generator for run identification
- [ ] Print queue manager
- [ ] Result input forms with validation

### 3.2 Results Capture Interface
**Timeline: Week 8-9**

#### Data Entry Components
- [ ] Guided scoring wizard
- [ ] Photo upload with annotation tools
- [ ] Measurement data entry with validation
- [ ] Print failure logging
- [ ] Time/material tracking

#### Mobile Companion
- [ ] Responsive design for tablet/phone
- [ ] QR code scanner for run identification
- [ ] Offline capability with sync
- [ ] Quick scoring mode

### 3.3 Statistical Analysis Tools
**Timeline: Week 9-10**

#### Analysis Features
```typescript
interface StatisticalAnalysis {
  mainEffects: MainEffect[];
  interactions: Interaction[];
  anova: ANOVATable;
  regression: RegressionModel;
  optimalSettings: ParameterSet;
  confidenceIntervals: ConfidenceInterval[];
}

interface MainEffect {
  factor: string;
  effect: number;
  significance: number; // p-value
  contribution: number; // % of variation
}

interface Interaction {
  factors: string[];
  effect: number;
  significance: number;
  plot: InteractionPlot;
}
```

#### Visualization Components
- [ ] Main effects plots
- [ ] Interaction plots
- [ ] Pareto charts
- [ ] Normal probability plots
- [ ] Residual analysis
- [ ] Response surface 3D plots

## Phase 4: Optimization & Output

### 4.1 Response Surface Optimization
**Timeline: Week 10-11**

#### Optimization Engine
```typescript
class ResponseOptimizer {
  findOptimum(
    model: RegressionModel,
    constraints: Constraint[],
    objectives: Objective[]
  ): OptimalSolution {
    // Gradient-based optimization
    // Desirability function approach
    // Multi-objective optimization
  }
}

interface OptimalSolution {
  parameters: ParameterSet;
  predictedQuality: number;
  confidence: number;
  robustness: number; // Sensitivity to variation
}
```

### 4.2 Interactive Visualization
**Timeline: Week 11-12**

#### 3D Response Surface Viewer
- [ ] WebGL-based 3D surface rendering
- [ ] Interactive parameter sliders
- [ ] Contour plot overlay
- [ ] Optimal region highlighting
- [ ] Constraint visualization

### 4.3 Profile Export System
**Timeline: Week 12**

#### Export Formats
```typescript
interface ExportedProfile {
  format: 'orcaslicer' | 'prusaslicer' | 'cura';
  settings: SlicerSettings;
  metadata: {
    experimentId: string;
    optimizationMethod: string;
    qualityScore: number;
    testDate: Date;
  };
}
```

#### Features
- [ ] Direct OrcaSlicer profile generation
- [ ] PrusaSlicer config export
- [ ] Cura profile conversion
- [ ] Settings comparison tool
- [ ] Version control integration

## Implementation Priorities

### Critical Path Items (Must Have)
1. **Taguchi L9 Array Generator** - Core DOE functionality
2. **Basic Test Models** - Cube, overhang, stringing tests
3. **G-code Parameter Injection** - Multi-parameter file generation
4. **Simple Scoring System** - 1-10 scale for key metrics
5. **Main Effects Analysis** - Identify significant factors

### High Priority (Should Have)
1. **Response Surface Methods** - Advanced optimization
2. **Comprehensive Test Library** - All standard models
3. **Photo-based Scoring** - Visual quality assessment
4. **Statistical Significance Testing** - ANOVA, regression
5. **3D Response Surface Plots** - Visualization

### Nice to Have
1. **Mobile Companion App** - Remote scoring
2. **AI-Assisted Scoring** - Computer vision quality detection
3. **Cloud Experiment Sharing** - Community database
4. **Automated Measurement** - Image processing for dimensions

## Technical Architecture

### Data Models
```typescript
// Core entities
- Experiment
- Design (Taguchi/RSM)
- Factor
- Run
- Result
- Analysis

// Relationships
- Experiment has one Design
- Design has many Runs
- Run has one Result
- Experiment has one Analysis
- Analysis references many Results
```

### State Management
- Use React Context for experiment session
- Local storage for work-in-progress
- Optional database for history
- Export/import capability

### File Generation Pipeline
1. Select experimental design
2. Choose test model
3. Define factor ranges
4. Generate run matrix
5. Create G-code variations
6. Package as 3MF projects
7. Generate tracking sheets

## Testing Strategy

### Unit Tests
- Taguchi array generation accuracy
- Statistical calculations
- G-code modification logic

### Integration Tests
- End-to-end experiment workflow
- File generation and parsing
- Data persistence

### Validation Tests
- Compare with established DOE software
- Verify statistical calculations
- Test with real print scenarios

## Success Metrics

1. **Efficiency**: Reduce calibration time by 50%
2. **Quality**: Achieve 20% improvement in print quality scores
3. **Reproducibility**: 90% consistency in optimal settings
4. **Adoption**: 100+ experiments completed in first month

## Next Steps

1. **Week 1**: Set up DOE module structure and Taguchi generator
2. **Week 2**: Implement basic test models and scoring system
3. **Week 3**: Build G-code generation pipeline
4. **Week 4**: Create experiment management UI
5. **Week 5**: Add statistical analysis tools
6. **Week 6**: Implement response surface methods
7. **Week 7**: Testing and refinement
8. **Week 8**: Documentation and release

## Resources Required

### Test Models
- [ ] Locate or create STL files for all test models
- [ ] Validate models for printability
- [ ] Standardize sizing and orientation

### Reference Materials
- [ ] Montgomery, D.C. "Design and Analysis of Experiments"
- [ ] Taguchi methods documentation
- [ ] Response surface methodology guides
- [ ] Statistical analysis libraries (stats.js)

### External Libraries
- [ ] simple-statistics - Statistical calculations
- [ ] plotly.js - 3D surface plots
- [ ] jstat - Advanced statistics
- [ ] qrcode.js - QR code generation

## Risk Mitigation

### Technical Risks
- **Complex Statistics**: Use proven libraries, validate against R/Python
- **Large File Generation**: Implement streaming and chunking
- **User Complexity**: Progressive disclosure, wizards, tutorials

### User Experience Risks
- **Learning Curve**: Provide templates and examples
- **Time Investment**: Show clear ROI, quick wins
- **Data Entry Burden**: Automation where possible

## Conclusion

This implementation plan transforms the CalibrationTool into a comprehensive DOE platform for 3D printing optimization. By following this phased approach, we can deliver a powerful tool that brings industrial-grade experimental design to desktop 3D printing, enabling users to achieve optimal print quality through systematic, data-driven calibration.
