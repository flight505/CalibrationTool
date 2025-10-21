/**
 * OrcaSlicer Temperature Tower Generator
 * Uses OrcaSlicer's official temperature tower template
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  MATERIAL_TEMP_PRESETS
} from './orcaTowerGenerator';
import { ParsedSTL } from './asciiStlUtils';
import { filterAsciiSTLByHeight } from './stlConverter';
import { exportTowerAs3MF } from './orca3mfExporter';
import { FirmwareType } from './postProcessingGenerator';

export interface TemperatureTowerParameters extends OrcaTowerParameters {
  type: 'temperature';
}

export class TemperatureTowerGenerator extends TowerGeneratorBase {
  private tempParams: TemperatureTowerParameters;

  constructor(params: TemperatureTowerParameters) {
    // Apply material presets if specified
    if (params.material && MATERIAL_TEMP_PRESETS[params.material]) {
      const preset = MATERIAL_TEMP_PRESETS[params.material];
      params = {
        ...params,
        startValue: params.startValue ?? preset.start,
        endValue: params.endValue ?? preset.end,
        stepSize: params.stepSize ?? preset.step
      };
    }

    // Set defaults specific to temperature towers
    // OrcaSlicer's temperature tower has specific dimensions
    const defaultParams: Partial<TemperatureTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 10.0, // OrcaSlicer standard
      towerWidth: 75,      // Actual OrcaSlicer dimensions
      towerDepth: 10
    };

    super({ ...defaultParams, ...params });
    this.tempParams = { ...defaultParams, ...params } as TemperatureTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${Math.round(value)}°C`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Load the OrcaSlicer temperature tower template
      const response = await fetch('/templates/temperature_tower_ascii.stl');
      if (!response.ok) {
        throw new Error(`Failed to load temperature tower template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.tempParams.baseHeight! + (this.sections.length * this.tempParams.sectionHeight!);
      
      // Filter the template to the required height
      // OrcaSlicer's template is designed for multiple sections, we trim as needed
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
        name: 'TemperatureTower',
        triangles
      };
    } catch (error) {
      console.error('Failed to generate temperature tower:', error);
      // Fallback to empty geometry
      return {
        name: 'TemperatureTower',
        triangles: []
      };
    }
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const modifierSettings = this.sections.map((section, index) => ({
      sectionIndex: index,
      settings: {
        'nozzle_temperature': section.value,
        'nozzle_temperature_initial_layer': index === 0 ? section.value + 5 : undefined
      }
    }));

    return {
      calibrationType: 'temperature',
      parameters: {
        material: this.params.material,
        startTemp: this.params.startValue,
        endTemp: this.params.endValue,
        stepSize: this.params.stepSize
      },
      modifierSettings
    };
  }

  protected getModifierSettings(section: typeof this.sections[0]): Record<string, string | number> {
    // OrcaSlicer setting key for nozzle temperature
    return {
      'nozzle_temperature': section.value.toString(),
    };
  }

  protected generateInstructions(): string {
    const { material, startValue, endValue, stepSize } = this.params;
    
    return `## Temperature Tower Calibration

### Tower Configuration:
- Material: ${material || 'Generic'}
- Temperature Range: ${startValue}°C to ${endValue}°C
- Step Size: ${stepSize}°C
- Sections: ${this.sections.length}

### Setup Instructions:
1. Import the STL file into OrcaSlicer
2. Set your filament type to ${material || 'your material'}
3. Enable "Variable Layer Height" if desired
4. Configure modifier meshes for each temperature section

### Printing:
1. Print the tower
2. Observe each section for:
   - Layer adhesion
   - Stringing
   - Overhangs
   - Bridging
   - Surface quality
3. Select the temperature with the best overall quality

### Modifier Mesh Settings:
${this.sections.map((s, i) => `Section ${i + 1}: ${s.label} - Height ${s.height}mm`).join('\n')}
`;
  }
}

/**
 * Convenience function to generate a temperature tower
 */
export async function generateTemperatureTower(params: Partial<TemperatureTowerParameters>) {
  const generator = new TemperatureTowerGenerator({
    type: 'temperature',
    startValue: 220,
    endValue: 180,
    stepSize: 5,
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export temperature tower as 3MF with post-processing
 */
export async function generateTemperatureTower3MF(
  params: Partial<TemperatureTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generateTemperatureTower(params);
  const material = params.material || 'PLA';
  
  return exportTowerAs3MF(
    tower,
    'temperature',
    `Temperature_Tower_${material}`,
    firmware,
    includePostProcessing
  );
}