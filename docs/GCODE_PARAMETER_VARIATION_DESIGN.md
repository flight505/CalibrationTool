# G-code Parameter Variation System Design

## Overview

This document outlines the design for a G-code parameter variation system that enables Design of Experiments (DOE) by generating multiple test prints with systematically varied parameters from a single base model.

## System Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│  DOE Experiment │────▶│ Base G-code  │────▶│ Parameter       │
│     Design      │     │  Generator   │     │ Injection       │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                      │
                                                      ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Batch Export    │◀────│ Metadata     │◀────│ G-code Files    │
│   (.3mf/.gcode) │     │  Embedder    │     │ (per run)       │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

## Core Components

### 1. Parameter Variation Engine

```typescript
interface ParameterVariationEngine {
  // Core parameters that can be varied
  parameters: VariableParameter[];

  // Generate G-code for each experimental run
  generateExperimentSet(
    baseGcode: string,
    experimentDesign: ExperimentalDesign
  ): GcodeFile[];

  // Apply parameter changes to G-code
  applyParameterVariations(
    gcode: string,
    parameters: Map<string, number>
  ): string;
}

interface VariableParameter {
  name: string;
  gcodeCommand: string;
  type: 'temperature' | 'speed' | 'flow' | 'acceleration' | 'retraction' | 'fan' | 'pressure_advance';
  unit: string;
  range: { min: number; max: number };
  applicationType: 'global' | 'layer' | 'feature' | 'object';
}
```

### 2. Supported Parameter Types

#### 2.1 Temperature Parameters
```typescript
const temperatureParams = {
  // Hotend temperature
  hotendTemp: {
    gcodeCommand: 'M104/M109',
    format: 'M109 S{value}',
    range: { min: 180, max: 280 },
    layerSpecific: true  // Can vary by layer
  },

  // Bed temperature
  bedTemp: {
    gcodeCommand: 'M140/M190',
    format: 'M190 S{value}',
    range: { min: 20, max: 120 },
    layerSpecific: false  // Usually constant
  },

  // Chamber temperature (if available)
  chamberTemp: {
    gcodeCommand: 'M141/M191',
    format: 'M191 S{value}',
    range: { min: 20, max: 80 },
    layerSpecific: false
  }
};
```

#### 2.2 Speed Parameters
```typescript
const speedParams = {
  // Print speed
  printSpeed: {
    gcodeCommand: 'M220',
    format: 'M220 S{value}',  // Percentage of nominal
    range: { min: 50, max: 200 },
    calculation: (mmps: number) => (mmps / baseSpeed) * 100
  },

  // Feed rate (direct F parameter)
  feedRate: {
    gcodeCommand: 'F',
    format: 'G1 F{value}',
    range: { min: 600, max: 12000 },  // mm/min
    inline: true  // Modified inline with move commands
  },

  // Travel speed
  travelSpeed: {
    gcodeCommand: 'F',
    format: 'G0 F{value}',
    range: { min: 3000, max: 30000 },
    moveType: 'travel'
  }
};
```

#### 2.3 Extrusion Parameters
```typescript
const extrusionParams = {
  // Flow rate multiplier
  flowRate: {
    gcodeCommand: 'M221',
    format: 'M221 S{value}',  // Percentage
    range: { min: 85, max: 115 },
    calculation: (ratio: number) => ratio * 100
  },

  // Extrusion multiplier (inline)
  extrusionMultiplier: {
    gcodeCommand: 'E',
    format: null,  // Modified inline
    range: { min: 0.85, max: 1.15 },
    inline: true,
    modify: (eValue: number, multiplier: number) => eValue * multiplier
  }
};
```

#### 2.4 Retraction Parameters
```typescript
const retractionParams = {
  // Retraction distance
  retractionDistance: {
    gcodeCommand: 'G10/G11',
    firmware: {
      marlin: 'M207 S{value}',
      klipper: 'SET_RETRACTION RETRACT_LENGTH={value}',
      rrf: 'M207 S{value}'
    },
    range: { min: 0, max: 10 }
  },

  // Retraction speed
  retractionSpeed: {
    gcodeCommand: 'M207',
    firmware: {
      marlin: 'M207 F{value}',
      klipper: 'SET_RETRACTION RETRACT_SPEED={value}',
      rrf: 'M207 F{value}'
    },
    range: { min: 10, max: 100 }
  },

  // Z-hop
  zHop: {
    gcodeCommand: 'M207',
    firmware: {
      marlin: 'M207 Z{value}',
      klipper: 'SET_RETRACTION LIFT_HEIGHT={value}',
      rrf: 'M207 Z{value}'
    },
    range: { min: 0, max: 2 }
  }
};
```

#### 2.5 Cooling Parameters
```typescript
const coolingParams = {
  // Fan speed
  fanSpeed: {
    gcodeCommand: 'M106',
    format: 'M106 S{value}',  // 0-255
    range: { min: 0, max: 255 },
    calculation: (percent: number) => Math.round(percent * 2.55)
  },

  // Minimum layer time
  minLayerTime: {
    gcodeCommand: null,  // Calculated during slicing
    requiresReslicing: true,
    range: { min: 5, max: 30 }
  }
};
```

#### 2.6 Advanced Parameters
```typescript
const advancedParams = {
  // Pressure advance / Linear advance
  pressureAdvance: {
    gcodeCommand: null,
    firmware: {
      marlin: 'M900 K{value}',
      klipper: 'SET_PRESSURE_ADVANCE ADVANCE={value}',
      rrf: 'M572 D0 S{value}'
    },
    range: { min: 0, max: 0.2 }
  },

  // Acceleration
  acceleration: {
    gcodeCommand: 'M204',
    format: 'M204 P{value} T{value}',  // Print and travel
    range: { min: 500, max: 10000 }
  },

  // Jerk / Junction deviation
  jerk: {
    gcodeCommand: null,
    firmware: {
      marlin: 'M205 X{value} Y{value}',
      klipper: null,  // Uses square_corner_velocity
      rrf: 'M566 X{value} Y{value}'
    },
    range: { min: 5, max: 20 }
  }
};
```

### 3. G-code Modification Strategies

#### 3.1 Global Parameter Changes
```typescript
class GlobalParameterModifier {
  apply(gcode: string, parameter: string, value: number): string {
    const lines = gcode.split('\n');
    const modifiedLines: string[] = [];

    // Add parameter change at start
    modifiedLines.push(this.generateCommand(parameter, value));
    modifiedLines.push(...lines);

    return modifiedLines.join('\n');
  }
}
```

#### 3.2 Layer-Based Changes
```typescript
class LayerBasedModifier {
  apply(
    gcode: string,
    changes: LayerChange[]
  ): string {
    const lines = gcode.split('\n');
    const modifiedLines: string[] = [];
    let currentLayer = 0;

    for (const line of lines) {
      // Detect layer change
      if (line.includes(';LAYER:') || line.includes('; layer')) {
        currentLayer = this.extractLayerNumber(line);

        // Apply changes for this layer
        const layerChanges = changes.filter(c => c.layer === currentLayer);
        for (const change of layerChanges) {
          modifiedLines.push(this.generateCommand(change.parameter, change.value));
        }
      }

      modifiedLines.push(line);
    }

    return modifiedLines.join('\n');
  }
}
```

#### 3.3 Height-Based Changes
```typescript
class HeightBasedModifier {
  apply(
    gcode: string,
    changes: HeightChange[]
  ): string {
    const lines = gcode.split('\n');
    const modifiedLines: string[] = [];
    let currentZ = 0;

    for (const line of lines) {
      // Track Z position
      const zMatch = line.match(/Z([\d.]+)/);
      if (zMatch) {
        currentZ = parseFloat(zMatch[1]);

        // Check for height-triggered changes
        const triggered = changes.filter(c =>
          c.height <= currentZ && !c.applied
        );

        for (const change of triggered) {
          modifiedLines.push(this.generateCommand(change.parameter, change.value));
          change.applied = true;
        }
      }

      modifiedLines.push(line);
    }

    return modifiedLines.join('\n');
  }
}
```

#### 3.4 Feature-Based Changes
```typescript
class FeatureBasedModifier {
  apply(
    gcode: string,
    featureParams: Map<FeatureType, ParameterSet>
  ): string {
    const lines = gcode.split('\n');
    const modifiedLines: string[] = [];
    let currentFeature: FeatureType = 'unknown';

    for (const line of lines) {
      // Detect feature type from comments
      const featureMatch = this.detectFeature(line);
      if (featureMatch && featureMatch !== currentFeature) {
        currentFeature = featureMatch;

        // Apply feature-specific parameters
        const params = featureParams.get(currentFeature);
        if (params) {
          for (const [param, value] of params) {
            modifiedLines.push(this.generateCommand(param, value));
          }
        }
      }

      modifiedLines.push(line);
    }

    return modifiedLines.join('\n');
  }

  private detectFeature(line: string): FeatureType | null {
    // OrcaSlicer feature comments
    if (line.includes(';TYPE:External perimeter')) return 'external_perimeter';
    if (line.includes(';TYPE:Internal perimeter')) return 'internal_perimeter';
    if (line.includes(';TYPE:Overhang perimeter')) return 'overhang';
    if (line.includes(';TYPE:Internal infill')) return 'infill';
    if (line.includes(';TYPE:Top solid infill')) return 'top_surface';
    if (line.includes(';TYPE:Bridge')) return 'bridge';
    if (line.includes(';TYPE:Support')) return 'support';

    return null;
  }
}
```

### 4. Experiment Metadata Embedding

```typescript
interface ExperimentMetadata {
  experimentId: string;
  runNumber: number;
  design: 'Taguchi' | 'CCD' | 'BoxBehnken' | 'Custom';
  factors: Factor[];
  timestamp: Date;
  checksum: string;  // For verification
}

class MetadataEmbedder {
  embed(gcode: string, metadata: ExperimentMetadata): string {
    const header = this.generateHeader(metadata);
    const qrData = this.generateQRData(metadata);

    return `
; === EXPERIMENT METADATA ===
; Experiment ID: ${metadata.experimentId}
; Run Number: ${metadata.runNumber}
; Design Type: ${metadata.design}
; Timestamp: ${metadata.timestamp.toISOString()}
; Factors:
${metadata.factors.map(f => `; - ${f.name}: ${f.value} ${f.unit}`).join('\n')}
; QR_DATA: ${qrData}
; === END METADATA ===

${gcode}
    `.trim();
  }

  generateQRData(metadata: ExperimentMetadata): string {
    // Compact JSON for QR code
    return btoa(JSON.stringify({
      id: metadata.experimentId,
      run: metadata.runNumber,
      factors: metadata.factors.map(f => ({
        n: f.name.substring(0, 3),
        v: f.value
      }))
    }));
  }
}
```

### 5. Multi-Object Support

```typescript
interface MultiObjectExperiment {
  objects: TestObject[];
  parameterAssignment: Map<TestObject, ParameterSet>;
  layout: PrintBedLayout;
}

class MultiObjectGcodeGenerator {
  generate(experiment: MultiObjectExperiment): string {
    const gcodeSegments: string[] = [];

    for (const object of experiment.objects) {
      const params = experiment.parameterAssignment.get(object);
      const position = experiment.layout.getPosition(object);

      // Generate object-specific G-code
      let objectGcode = this.sliceObject(object);

      // Apply transformations
      objectGcode = this.translateToPosition(objectGcode, position);

      // Apply parameter variations
      objectGcode = this.applyParameters(objectGcode, params);

      // Add object markers
      objectGcode = this.addObjectMarkers(objectGcode, object.id);

      gcodeSegments.push(objectGcode);
    }

    return this.mergeGcodeSegments(gcodeSegments);
  }

  private addObjectMarkers(gcode: string, objectId: string): string {
    return `
; === START OBJECT: ${objectId} ===
${gcode}
; === END OBJECT: ${objectId} ===
    `.trim();
  }
}
```

### 6. Batch File Generation

```typescript
class BatchGcodeExporter {
  async exportExperiment(
    experiment: DOEExperiment,
    format: 'gcode' | '3mf' | 'both'
  ): Promise<ExportResult> {
    const files: ExportFile[] = [];

    for (const run of experiment.runs) {
      // Generate G-code for this run
      const gcode = await this.generateRunGcode(run);

      // Create filename with parameter encoding
      const filename = this.generateFilename(experiment, run);

      if (format === 'gcode' || format === 'both') {
        files.push({
          name: `${filename}.gcode`,
          content: gcode,
          type: 'gcode'
        });
      }

      if (format === '3mf' || format === 'both') {
        const project = await this.create3MFProject(gcode, run);
        files.push({
          name: `${filename}.3mf`,
          content: project,
          type: '3mf'
        });
      }
    }

    // Create zip archive
    const archive = await this.createArchive(files, experiment);

    // Generate run sheet
    const runSheet = this.generateRunSheet(experiment);

    return {
      archive,
      runSheet,
      files: files.length,
      totalSize: this.calculateSize(files)
    };
  }

  private generateFilename(experiment: DOEExperiment, run: Run): string {
    // Format: ExpID_RunXX_Param1Val_Param2Val
    const expId = experiment.id.substring(0, 8);
    const runNum = String(run.number).padStart(2, '0');

    const paramString = run.parameters
      .map(p => `${p.name.substring(0, 3)}${p.value}`)
      .join('_');

    return `${expId}_Run${runNum}_${paramString}`;
  }
}
```

### 7. Validation and Safety

```typescript
class GcodeValidator {
  validate(gcode: string): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check temperature limits
    const tempCommands = this.extractTemperatureCommands(gcode);
    for (const cmd of tempCommands) {
      if (cmd.value > 300) {
        issues.push({
          type: 'safety',
          severity: 'error',
          message: `Temperature ${cmd.value}°C exceeds safety limit`
        });
      }
    }

    // Check for conflicting parameters
    const conflicts = this.findParameterConflicts(gcode);
    issues.push(...conflicts);

    // Verify required startup sequence
    if (!this.hasProperStartup(gcode)) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: 'Missing proper startup sequence'
      });
    }

    // Check for proper ending
    if (!this.hasProperEnding(gcode)) {
      issues.push({
        type: 'structure',
        severity: 'warning',
        message: 'Missing proper ending sequence'
      });
    }

    return {
      valid: issues.filter(i => i.severity === 'error').length === 0,
      issues
    };
  }
}
```

## Implementation Plan

### Phase 1: Core Infrastructure
1. Parameter definition system
2. Basic G-code parser
3. Global parameter modifier
4. Single-file generation

### Phase 2: Advanced Modifications
1. Layer-based modifications
2. Height-based modifications
3. Feature detection and modification
4. Multi-parameter interactions

### Phase 3: Experiment Management
1. Metadata embedding
2. Batch generation
3. File naming convention
4. Archive creation

### Phase 4: Integration
1. Connect to DOE designs
2. Link with slicer settings
3. Validation system
4. Export to OrcaSlicer

## Usage Example

```typescript
// Define experiment
const experiment = {
  design: taguchiL9,
  factors: [
    { name: 'Temperature', levels: [190, 210, 230] },
    { name: 'Speed', levels: [30, 50, 70] },
    { name: 'FanSpeed', levels: [0, 50, 100] }
  ],
  testModel: 'calibration_cube.stl'
};

// Generate G-code variations
const generator = new DOEGcodeGenerator();
const files = await generator.generateExperiment(experiment);

// Export batch
const exporter = new BatchGcodeExporter();
const result = await exporter.export(files, '3mf');

// Download archive
downloadFile(result.archive, `experiment_${Date.now()}.zip`);
```

## Conclusion

This G-code parameter variation system provides the foundation for DOE implementation, enabling systematic testing of multiple parameters through automated G-code generation. The system supports various modification strategies, safety validation, and batch export capabilities essential for efficient experimental calibration.