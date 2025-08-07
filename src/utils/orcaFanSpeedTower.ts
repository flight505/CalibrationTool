/**
 * OrcaSlicer Fan Speed Tower Generator
 * Uses AutoTowersGenerator's fan tower template
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

export interface FanSpeedTowerParameters extends OrcaTowerParameters {
  type: 'fan_speed';
  includeBridge?: boolean;
  includeOverhang?: boolean;
  includeStringingTest?: boolean;
}

export class FanSpeedTowerGenerator extends TowerGeneratorBase {
  private fanParams: FanSpeedTowerParameters;

  constructor(params: FanSpeedTowerParameters) {
    // Set defaults specific to fan speed towers
    const defaultParams: Partial<FanSpeedTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 10.0,
      towerWidth: 60,
      towerDepth: 30,
      startValue: 0,      // 0% fan
      endValue: 100,      // 100% fan
      stepSize: 20,       // 20% increments
      includeBridge: true,
      includeOverhang: true,
      includeStringingTest: true
    };

    super({ ...defaultParams, ...params });
    this.fanParams = { ...defaultParams, ...params } as FanSpeedTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${Math.round(value)}%`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Load the AutoTowersGenerator fan tower template
      const response = await fetch('/templates/fan_tower_ascii.stl');
      if (!response.ok) {
        throw new Error(`Failed to load fan tower template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.fanParams.baseHeight! + (this.sections.length * this.fanParams.sectionHeight!);
      
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
        name: 'FanSpeedTower',
        triangles
      };
    } catch (error) {
      console.error('Failed to generate fan speed tower:', error);
      // Fallback to empty geometry
      return {
        name: 'FanSpeedTower',
        triangles: []
      };
    }
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const settings: OrcaSlicerSettings = {
      calibrationType: 'fan_speed',
      parameters: {
        start_fan_speed: this.params.startValue,
        end_fan_speed: this.params.endValue,
        fan_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        include_bridge: this.fanParams.includeBridge,
        include_overhang: this.fanParams.includeOverhang,
        include_stringing: this.fanParams.includeStringingTest
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const fanSpeed = section.value / 100; // Convert percentage to 0-1 range
      
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'fan_speed': fanSpeed,
          'layer_time_fan_speed_100': fanSpeed,
          'overhang_fan_speed': Math.min(fanSpeed + 0.2, 1.0), // Boost for overhangs
          'bridge_fan_speed': 1.0 // Always max for bridges
        }
      });
    }

    return settings;
  }

  protected generateInstructions(): string {
    const { startValue, endValue, stepSize } = this.params;
    
    return `## Fan Speed Tower Calibration

### Tower Configuration:
- Fan Speed Range: ${startValue}% to ${endValue}%
- Step Size: ${stepSize}%
- Sections: ${this.sections.length}

### Features to Evaluate:
1. **Bridging Quality** - Look for sagging or drooping
2. **Overhang Performance** - Check angles (30°, 45°, 60°, 75°)
3. **Stringing** - Check for wisps between pillars
4. **Layer Adhesion** - Too much cooling can cause delamination
5. **Surface Quality** - Look for warping or curling corners

### Setup Instructions for OrcaSlicer:
1. Import the STL file
2. Set layer height to 0.2mm
3. Use your calibrated temperature
4. Print speed: 50-60mm/s
5. No supports needed

### Modifier Mesh Settings:
${this.sections.map((s, i) => `Section ${i + 1}: ${s.label} - Height ${s.height}mm`).join('\n')}

### Material Guidelines:
- **PLA**: Usually needs high cooling (80-100%)
- **PETG**: Moderate cooling (30-50%)
- **ABS/ASA**: Minimal cooling (0-30%)
- **TPU**: Low to no cooling (0-20%)

### Tips:
- Start with manufacturer recommendations
- Too much cooling causes poor layer adhesion
- Too little cooling causes poor overhangs and bridges
- Different colors of same material may need different settings
`;
  }
}

/**
 * Convenience function to generate a fan speed tower
 */
export async function generateFanSpeedTower(params: Partial<FanSpeedTowerParameters>) {
  const generator = new FanSpeedTowerGenerator({
    type: 'fan_speed',
    startValue: 0,
    endValue: 100,
    stepSize: 20,
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export fan speed tower as 3MF with post-processing
 */
export async function generateFanSpeedTower3MF(
  params: Partial<FanSpeedTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generateFanSpeedTower(params);
  const material = params.material || 'PLA';
  
  return exportTowerAs3MF(
    tower,
    'fan_speed',
    `Fan_Speed_Tower_${material}`,
    firmware,
    includePostProcessing
  );
}