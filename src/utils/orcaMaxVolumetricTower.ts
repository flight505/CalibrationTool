/**
 * OrcaSlicer Max Volumetric Speed Tower Generator
 * Uses AutoTowersGenerator's speed tower template for volumetric flow testing
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

export interface MaxVolumetricTowerParameters extends OrcaTowerParameters {
  type: 'max_volumetric';
  layerHeight?: number;
  lineWidth?: number;
  nozzleSize?: number;
  testPattern?: 'spiral' | 'straight' | 'zigzag';
  includeInfill?: boolean;
  infillPercentage?: number;
}

export class MaxVolumetricTowerGenerator extends TowerGeneratorBase {
  private volumetricParams: MaxVolumetricTowerParameters;

  constructor(params: MaxVolumetricTowerParameters) {
    // Set defaults specific to max volumetric speed towers
    const defaultParams: Partial<MaxVolumetricTowerParameters> = {
      baseHeight: 2.0,
      sectionHeight: 10.0,
      towerWidth: 40,
      towerDepth: 40,
      startValue: 5,      // 5 mm³/s
      endValue: 25,      // 25 mm³/s
      stepSize: 2,       // 2 mm³/s increments
      layerHeight: 0.2,
      lineWidth: 0.45,   // Slightly wider for better flow
      nozzleSize: 0.4,
      testPattern: 'spiral',
      includeInfill: true,
      infillPercentage: 30
    };

    super({ ...defaultParams, ...params });
    this.volumetricParams = { ...defaultParams, ...params } as MaxVolumetricTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${value.toFixed(1)} mm³/s`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Load the AutoTowersGenerator speed tower template
      // Speed towers are often used for volumetric flow testing
      const response = await fetch('/templates/speed_tower_ascii.stl');
      if (!response.ok) {
        throw new Error(`Failed to load speed tower template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.volumetricParams.baseHeight! + (this.sections.length * this.volumetricParams.sectionHeight!);
      
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
      
      return {
        name: 'MaxVolumetricTower',
        triangles
      };
    } catch (error) {
      console.error('Failed to generate max volumetric tower:', error);
      // Fallback to empty geometry
      return {
        name: 'MaxVolumetricTower',
        triangles: []
      };
    }
  }

  /**
   * Calculate print speed from volumetric flow rate
   */
  private calculatePrintSpeed(volumetricSpeed: number): number {
    const { layerHeight, lineWidth } = this.volumetricParams;
    // Speed (mm/s) = Volumetric Speed (mm³/s) / (Layer Height × Line Width)
    return volumetricSpeed / (layerHeight! * lineWidth!);
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const settings: OrcaSlicerSettings = {
      calibrationType: 'max_volumetric_speed',
      parameters: {
        start_volumetric: this.params.startValue,
        end_volumetric: this.params.endValue,
        volumetric_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        layer_height: this.volumetricParams.layerHeight,
        line_width: this.volumetricParams.lineWidth,
        nozzle_size: this.volumetricParams.nozzleSize,
        test_pattern: this.volumetricParams.testPattern,
        include_infill: this.volumetricParams.includeInfill,
        infill_percentage: this.volumetricParams.infillPercentage
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const printSpeed = this.calculatePrintSpeed(section.value);
      
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'max_volumetric_speed': section.value,
          'print_speed': printSpeed,
          'infill_speed': printSpeed,
          'solid_infill_speed': printSpeed * 0.8,
          'top_solid_infill_speed': printSpeed * 0.6,
          'support_speed': printSpeed * 0.8,
          'travel_speed': Math.max(150, printSpeed * 2)
        }
      });
    }

    return settings;
  }

  protected getModifierSettings(section: typeof this.sections[0]): Record<string, string | number> {
    // Convert volumetric speed (mm³/s) to linear speed (mm/s)
    const { layerHeight, lineWidth } = this.volumetricParams;
    const volumetricSpeed = section.value;
    const linearSpeed = volumetricSpeed / (layerHeight! * lineWidth!);

    // OrcaSlicer setting keys for print speeds
    return {
      'outer_wall_speed': Math.round(linearSpeed),
      'inner_wall_speed': Math.round(linearSpeed),
      'sparse_infill_speed': Math.round(linearSpeed),
    };
  }

  protected generateInstructions(): string {
    const { startValue, endValue, stepSize, layerHeight, lineWidth, nozzleSize } = this.volumetricParams;
    
    return `## Max Volumetric Speed Tower Calibration

### Tower Configuration:
- Volumetric Range: ${startValue} to ${endValue} mm³/s
- Step Size: ${stepSize} mm³/s
- Layer Height: ${layerHeight}mm
- Line Width: ${lineWidth}mm
- Nozzle Size: ${nozzleSize}mm
- Sections: ${this.sections.length}

### What to Look For:
1. **Under-extrusion** - Gaps between lines, rough surface
2. **Extruder Skipping** - Clicking sounds, inconsistent flow
3. **Layer Adhesion** - Poor bonding at high speeds
4. **Surface Quality** - Ripples, inconsistencies
5. **Dimensional Accuracy** - Measure walls for consistency

### Setup Instructions for OrcaSlicer:
1. Import the STL file
2. Set layer height to ${layerHeight}mm
3. Set line width to ${lineWidth}mm
4. Use your calibrated temperature (or slightly higher)
5. Disable volumetric speed limits initially

### Modifier Mesh Settings:
${this.sections.map((s, i) => {
  const speed = this.calculatePrintSpeed(s.value);
  return `Section ${i + 1}: ${s.label} = ${speed.toFixed(0)}mm/s print speed`;
}).join('\n')}

### How to Determine Maximum:
1. Print the tower
2. Find the highest section with:
   - No under-extrusion
   - No extruder skipping
   - Good layer adhesion
   - Acceptable surface quality
3. Use 80-90% of that value as your safe maximum

### Material Guidelines:
- **PLA**: 8-15 mm³/s typical
- **PETG**: 8-13 mm³/s typical
- **ABS/ASA**: 11-15 mm³/s typical
- **TPU**: 2-5 mm³/s typical
- **High-flow hotends**: Can achieve 25-40 mm³/s

### Calculation Formula:
Print Speed (mm/s) = Volumetric Speed (mm³/s) / (Layer Height × Line Width)

Example: ${startValue} mm³/s / (${layerHeight}mm × ${lineWidth}mm) = ${this.calculatePrintSpeed(startValue).toFixed(0)}mm/s

### Tips:
- Higher temperatures increase max flow
- Larger nozzles allow higher volumetric speeds
- Quality hotends make a significant difference
- Consider hotend upgrade if limited by flow
`;
  }
}

/**
 * Convenience function to generate a max volumetric speed tower
 */
export async function generateMaxVolumetricTower(params: Partial<MaxVolumetricTowerParameters>) {
  const generator = new MaxVolumetricTowerGenerator({
    type: 'max_volumetric',
    startValue: 5,
    endValue: 25,
    stepSize: 2,
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export max volumetric speed tower as 3MF with post-processing
 */
export async function generateMaxVolumetricTower3MF(
  params: Partial<MaxVolumetricTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generateMaxVolumetricTower(params);
  const material = params.material || 'PLA';
  
  return exportTowerAs3MF(
    tower,
    'max_volumetric_speed',
    `Max_Volumetric_Tower_${material}`,
    firmware,
    includePostProcessing
  );
}