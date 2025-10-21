/**
 * OrcaSlicer Pressure Advance Tower Generator
 * Generates pressure advance/linear advance calibration towers
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  PA_PRESETS
} from './orcaTowerGenerator';
import { ParsedSTL } from './asciiStlUtils';
import { filterAsciiSTLByHeight } from './stlConverter';
import { exportTowerAs3MF } from './orca3mfExporter';
import { FirmwareType } from './postProcessingGenerator';

export interface PressureAdvanceTowerParameters extends OrcaTowerParameters {
  type: 'pressure_advance';
  extruderType?: 'direct_drive' | 'bowden' | 'high_speed';
  lineWidth?: number;
  printSpeed?: number;
  accelerations?: number[];
}

export class PressureAdvanceTowerGenerator extends TowerGeneratorBase {
  private paParams: PressureAdvanceTowerParameters;

  constructor(params: PressureAdvanceTowerParameters) {
    // Apply extruder type presets if specified
    if (params.extruderType && PA_PRESETS[params.extruderType]) {
      const preset = PA_PRESETS[params.extruderType];
      params = {
        ...params,
        startValue: params.startValue ?? preset.start,
        endValue: params.endValue ?? preset.end,
        stepSize: params.stepSize ?? preset.step
      };
    }

    // Set defaults specific to PA towers
    const defaultParams: Partial<PressureAdvanceTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 5.0, // Smaller sections for PA testing
      towerWidth: 60,
      towerDepth: 20,
      lineWidth: 0.4,
      printSpeed: 100,
      accelerations: [3000, 5000, 7000]
    };

    super({ ...defaultParams, ...params });
    this.paParams = { ...defaultParams, ...params } as PressureAdvanceTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `PA ${value.toFixed(3)}`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Load the OrcaSlicer PA pattern template
      const response = await fetch('/templates/pa_pattern_ascii.stl');
      if (!response.ok) {
        throw new Error(`Failed to load PA pattern template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.paParams.baseHeight! + (this.sections.length * this.paParams.sectionHeight!);
      
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
        name: 'PressureAdvanceTower',
        triangles
      };
    } catch (error) {
      console.error('Failed to generate pressure advance tower:', error);
      // Fallback to empty geometry
      return {
        name: 'PressureAdvanceTower',
        triangles: []
      };
    }
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const settings: OrcaSlicerSettings = {
      calibrationType: 'pressure_advance',
      parameters: {
        start_pa: this.params.startValue,
        end_pa: this.params.endValue,
        pa_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        extruder_type: this.paParams.extruderType || 'direct_drive',
        print_speed: this.paParams.printSpeed,
        accelerations: this.paParams.accelerations
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'pressure_advance': section.value,
          // OrcaSlicer uses different names for Klipper vs Marlin
          'linear_advance': section.value, // Marlin
          'pa_value': section.value // Klipper
        }
      });
    }

    return settings;
  }

  protected getModifierSettings(section: typeof this.sections[0]): Record<string, string | number> {
    // OrcaSlicer setting key for pressure advance
    return {
      'pressure_advance': section.value,
    };
  }

  protected generateInstructions(): string {
    const baseInstructions = super.generateInstructions();
    
    const additionalInstructions = `
Pressure Advance Tower Specific Instructions:
==============================================

Extruder Type: ${this.paParams.extruderType || 'Not specified'}
PA Range: ${this.params.startValue} to ${this.params.endValue}
Step: ${this.params.stepSize}

What to Look For:
1. Corner Quality - Sharp corners without bulging
2. Line Consistency - Even width throughout direction changes
3. No Gaps - Consistent extrusion at acceleration points
4. No Blobs - Clean starts and stops
5. Seam Quality - Clean layer transitions

OrcaSlicer Setup:
1. Import the main tower STL
2. For each PA section, add a modifier mesh
3. Set the pressure advance value for each modifier:
${this.sections.map((s, i) => `   Section ${i + 1}: ${s.label}`).join('\n')}

Recommended Print Settings:
- Layer Height: 0.2mm
- Print Speed: ${this.paParams.printSpeed}mm/s or higher
- Acceleration: ${this.paParams.accelerations?.join(', ')}mm/s²
- No Z-hop (can affect PA calibration)
- Cooling: Normal for material

Typical PA Values:
- Direct Drive: 0.02-0.10
- Bowden: 0.20-0.80
- High-Speed Direct: 0.01-0.05

Tips:
- Print multiple towers at different speeds
- Higher acceleration shows PA effects more clearly
- Look for the height where corners are sharpest
- Check that lines maintain consistent width
`;

    return baseInstructions + additionalInstructions;
  }
}

/**
 * Convenience function to generate a pressure advance tower
 */
export async function generatePressureAdvanceTower(params: Partial<PressureAdvanceTowerParameters>) {
  const generator = new PressureAdvanceTowerGenerator({
    type: 'pressure_advance',
    startValue: 0.00,
    endValue: 0.10,
    stepSize: 0.01,
    extruderType: 'direct_drive',
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export pressure advance tower as 3MF with post-processing
 */
export async function generatePressureAdvanceTower3MF(
  params: Partial<PressureAdvanceTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generatePressureAdvanceTower(params);
  const extruderType = params.extruderType || 'direct_drive';
  
  return exportTowerAs3MF(
    tower,
    'pressure_advance',
    `Pressure_Advance_Tower_${extruderType}`,
    firmware,
    includePostProcessing
  );
}