/**
 * OrcaSlicer Pressure Advance Pattern Generator
 * Uses OrcaSlicer's official PA test pattern (not a tower)
 */

import { ParsedSTL } from './asciiStlUtils';
import { stlToString } from './asciiStlUtils';

export interface PressureAdvancePatternParameters {
  type: 'pattern' | 'tower_with_seam';
  startValue?: number;
  endValue?: number;
  stepSize?: number;
  extruderType?: 'direct_drive' | 'bowden';
}

export interface GeneratedPAPattern {
  mainSTL: Blob;
  instructions: string;
  parameters: PressureAdvancePatternParameters;
}

/**
 * PA presets for different extruder types
 */
const PA_PRESETS = {
  direct_drive: { 
    start: 0.00, 
    end: 0.10, 
    step: 0.01,
    description: 'Direct Drive Extruder'
  },
  bowden: { 
    start: 0.00, 
    end: 0.50, 
    step: 0.05,
    description: 'Bowden Extruder'
  }
};

export class PressureAdvancePatternGenerator {
  private params: PressureAdvancePatternParameters;

  constructor(params: PressureAdvancePatternParameters) {
    // Apply extruder presets if specified
    const extruderType = params.extruderType || 'direct_drive';
    const preset = PA_PRESETS[extruderType];
    
    this.params = {
      type: params.type || 'pattern',
      startValue: params.startValue ?? preset.start,
      endValue: params.endValue ?? preset.end,
      stepSize: params.stepSize ?? preset.step,
      extruderType
    };
  }

  public async generate(): Promise<GeneratedPAPattern> {
    const geometry = await this.loadPAPattern();
    const mainSTL = new Blob([stlToString(geometry)], { type: 'application/sla' });
    
    return {
      mainSTL,
      instructions: this.generateInstructions(),
      parameters: this.params
    };
  }

  private async loadPAPattern(): Promise<ParsedSTL> {
    try {
      // Choose the appropriate template based on type
      const templateFile = this.params.type === 'tower_with_seam' 
        ? '/templates/pa_tower_with_seam_ascii.stl'
        : '/templates/pa_pattern_ascii.stl';
      
      const response = await fetch(templateFile);
      if (!response.ok) {
        throw new Error(`Failed to load PA pattern template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Parse the ASCII STL to get triangles
      const lines = templateContent.split('\n');
      const triangles = [];
      let currentTriangle: any = {};
      let vertices: any[] = [];
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('facet normal')) {
          const parts = trimmed.split(/\s+/);
          currentTriangle.normal = {
            x: parseFloat(parts[2]),
            y: parseFloat(parts[3]),
            z: parseFloat(parts[4])
          };
          vertices = [];
        } else if (trimmed.startsWith('vertex')) {
          const parts = trimmed.split(/\s+/);
          vertices.push({
            x: parseFloat(parts[1]),
            y: parseFloat(parts[2]),
            z: parseFloat(parts[3])
          });
        } else if (trimmed === 'endfacet') {
          if (currentTriangle.normal && vertices.length === 3) {
            triangles.push({
              normal: currentTriangle.normal,
              vertices: vertices as [any, any, any]
            });
          }
          currentTriangle = {};
        }
      }
      
      const patternName = this.params.type === 'tower_with_seam' 
        ? 'PATowerWithSeam'
        : 'PressureAdvancePattern';
      
      return {
        name: patternName,
        triangles
      };
    } catch (error) {
      console.error('Failed to load PA pattern:', error);
      return {
        name: 'PressureAdvancePattern',
        triangles: []
      };
    }
  }

  private generateInstructions(): string {
    const { startValue, endValue, stepSize, extruderType, type } = this.params;
    const preset = PA_PRESETS[extruderType || 'direct_drive'];
    
    if (type === 'tower_with_seam') {
      return `## Pressure Advance Tower with Seam Test

### Purpose:
This test combines PA calibration with seam quality assessment.

### Configuration:
- Extruder Type: ${preset.description}
- PA Range: ${startValue} to ${endValue}
- Step Size: ${stepSize}

### Setup in OrcaSlicer:
1. Import the STL file
2. Slice with:
   - Layer Height: 0.2mm
   - Perimeters: 2
   - Infill: 20%
   - Seam Position: Aligned
3. Add PA modifier values at different heights

### Evaluation:
- Check seam quality at each PA value
- Look for minimal bulging at corners
- Assess overall surface quality
`;
    }
    
    return `## Pressure Advance Pattern Calibration

### Test Configuration:
- Extruder Type: ${preset.description}
- PA Range: ${startValue} to ${endValue}
- Step Size: ${stepSize}

### Setup Instructions for OrcaSlicer:

1. **Import the STL**:
   - Load the PA pattern STL file
   - Position at center of build plate

2. **Slice Settings**:
   - Layer Height: 0.2mm (recommended)
   - Line Width: 0.4mm (match nozzle size)
   - Perimeters: 2
   - Top/Bottom Layers: 0
   - Infill: 0%
   - Print Speed: Your normal speed
   - Acceleration: Your calibrated values

3. **PA Configuration**:
   - Go to Filament Settings → Advanced
   - Set PA values using modifier meshes or manual G-code
   - For Klipper: Add SET_PRESSURE_ADVANCE ADVANCE={value}
   - For Marlin: Use M900 K{value}

### How to Evaluate:

1. **Print the Pattern**:
   - Each section tests a different PA value
   - Watch for corner quality and line consistency

2. **Visual Inspection**:
   - **Too Low PA**: Bulging at corners, excess material after direction changes
   - **Optimal PA**: Sharp corners, consistent line width
   - **Too High PA**: Gaps at corners, under-extrusion after direction changes

3. **Measurement Method**:
   - Use calipers to measure corner sharpness
   - Check line width consistency
   - Look for gaps or bulges

### Recommended PA Values by Material:
- PLA: 0.03-0.05 (Direct Drive)
- PETG: 0.04-0.08 (Direct Drive)
- ABS: 0.03-0.06 (Direct Drive)
- TPU: 0.00-0.02 (Direct Drive)

For Bowden setups, multiply values by 5-10x.

### Firmware Commands:
- **Klipper**: SET_PRESSURE_ADVANCE ADVANCE=${startValue}
- **Marlin**: M900 K${startValue}
- **RRF**: M572 D0 S${startValue}
`;
  }
}