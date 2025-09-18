/**
 * OrcaSlicer Flow Rate Tower Generator
 * Uses AutoTowersGenerator's flow tower template
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings
} from './orcaTowerGenerator';
import { ParsedSTL } from './asciiStlUtils';
import { filterAsciiSTLByHeight } from './stlConverter';
import { exportTowerAs3MF } from './orca3mfExporter';
import { FirmwareType } from './postProcessingGenerator';

export interface FlowRateTowerParameters extends OrcaTowerParameters {
  type: 'flow_rate';
  wallThickness?: number;
  includeTopSurface?: boolean;
  includeThinWalls?: boolean;
  nozzleSize?: number;
  useSpiral?: boolean; // Use spiral version of flow tower
}

export class FlowRateTowerGenerator extends TowerGeneratorBase {
  private flowParams: FlowRateTowerParameters;

  constructor(params: FlowRateTowerParameters) {
    // Set defaults specific to flow rate towers
    const defaultParams: Partial<FlowRateTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 10.0,
      towerWidth: 30,
      towerDepth: 30,
      startValue: 0.90,   // 90% flow
      endValue: 1.10,     // 110% flow
      stepSize: 0.05,     // 5% increments
      wallThickness: 1.2, // 3 perimeters for 0.4mm nozzle
      includeTopSurface: true,
      includeThinWalls: true,
      nozzleSize: 0.4,
      useSpiral: false
    };

    super({ ...defaultParams, ...params });
    this.flowParams = { ...defaultParams, ...params } as FlowRateTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Choose the appropriate template
      const templateFile = this.flowParams.useSpiral 
        ? '/templates/flow_tower_spiral_ascii.stl'
        : '/templates/flow_tower_ascii.stl';
      
      // Load the AutoTowersGenerator flow tower template
      const response = await fetch(templateFile);
      if (!response.ok) {
        throw new Error(`Failed to load flow tower template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.flowParams.baseHeight! + (this.sections.length * this.flowParams.sectionHeight!);
      
      // Filter the template to the required height
      const filteredSTL = filterAsciiSTLByHeight(templateContent, totalHeight);
      
      // Parse the filtered STL to get triangles
      const lines = filteredSTL.split('\n');
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
      
      const towerName = this.flowParams.useSpiral ? 'FlowRateTowerSpiral' : 'FlowRateTower';
      
      return {
        name: towerName,
        triangles
      };
    } catch (error) {
      console.error('Failed to generate flow rate tower:', error);
      // Fallback to empty geometry
      return {
        name: 'FlowRateTower',
        triangles: []
      };
    }
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const settings: OrcaSlicerSettings = {
      calibrationType: 'flow_rate',
      parameters: {
        start_flow: this.params.startValue,
        end_flow: this.params.endValue,
        flow_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        wall_thickness: this.flowParams.wallThickness,
        nozzle_size: this.flowParams.nozzleSize,
        include_thin_walls: this.flowParams.includeThinWalls,
        use_spiral: this.flowParams.useSpiral
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'flow_ratio': section.value,
          'bridge_flow_ratio': section.value,
          'top_surface_flow_ratio': section.value,
          'internal_solid_infill_flow_ratio': section.value
        }
      });
    }

    return settings;
  }

  protected generateInstructions(): string {
    const { startValue, endValue, stepSize, wallThickness, nozzleSize, useSpiral } = this.flowParams;
    
    return `## Flow Rate Tower Calibration

### Tower Configuration:
- Flow Rate Range: ${(startValue * 100).toFixed(0)}% to ${(endValue * 100).toFixed(0)}%
- Step Size: ${(stepSize * 100).toFixed(0)}%
- Wall Thickness: ${wallThickness}mm
- Nozzle Size: ${nozzleSize}mm
- Tower Type: ${useSpiral ? 'Spiral' : 'Standard'}
- Sections: ${this.sections.length}

### How to Measure:
1. Use calipers to measure wall thickness at each section
2. Compare measured thickness to expected (${wallThickness}mm)
3. Look for the section with most accurate dimensions
4. Check thin wall quality (should be exactly ${nozzleSize}mm)

### What to Look For:
1. **Wall Dimension Accuracy** - Measure with calipers
2. **Surface Quality** - No gaps or over-extrusion
3. **Corner Quality** - Sharp, well-defined corners
4. **Thin Wall Consistency** - Even width throughout
5. **Top Surface** - Smooth and even (if enabled)

### Setup Instructions for OrcaSlicer:
1. Import the STL file
2. Set wall loops to 3 (for ${wallThickness}mm walls)
3. Infill: 20-30%
4. Layer height: 0.2mm
5. Use your calibrated temperature

### Modifier Mesh Settings:
${this.sections.map((s, i) => `Section ${i + 1}: ${s.label} - Flow ratio ${s.value.toFixed(2)}`).join('\n')}

### Calculation Formula:
New Flow Ratio = Current Flow × (Expected Width / Measured Width)

### Example:
- Expected: ${wallThickness}mm
- Measured: 1.25mm  
- Current Flow: 1.00
- New Flow = 1.00 × (${wallThickness}/1.25) = ${(wallThickness! / 1.25).toFixed(3)}

### Tips:
- Measure multiple points and average
- Check both X and Y wall dimensions
- Thin walls help verify single-line extrusion
- Different colors may need different flow rates
- ${useSpiral ? 'Spiral mode provides continuous flow testing' : 'Standard mode provides discrete sections'}
`;
  }
}

/**
 * Convenience function to generate a flow rate tower
 */
export async function generateFlowRateTower(params: Partial<FlowRateTowerParameters>) {
  const generator = new FlowRateTowerGenerator({
    type: 'flow_rate',
    startValue: 0.90,
    endValue: 1.10,
    stepSize: 0.05,
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export flow rate tower as 3MF with post-processing
 */
export async function generateFlowRateTower3MF(
  params: Partial<FlowRateTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generateFlowRateTower(params);
  const material = params.material || 'PLA';
  
  return exportTowerAs3MF(
    tower,
    'flow_rate',
    `Flow_Rate_Tower_${material}`,
    firmware,
    includePostProcessing
  );
}
