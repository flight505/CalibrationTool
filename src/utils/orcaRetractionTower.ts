/**
 * OrcaSlicer Retraction Tower Generator
 * Uses OrcaSlicer's retraction tower template with post-processing support
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

// Retraction presets for different extruder types
export const RETRACTION_PRESETS = {
  direct_drive: {
    startDistance: 0.2,
    endDistance: 2.0,
    stepDistance: 0.2,
    speed: 30  // mm/s
  },
  bowden: {
    startDistance: 1.0,
    endDistance: 6.0,
    stepDistance: 0.5,
    speed: 40  // mm/s
  },
  high_speed: {
    startDistance: 0.1,
    endDistance: 1.0,
    stepDistance: 0.1,
    speed: 50  // mm/s
  }
};

export interface RetractionTowerParameters extends OrcaTowerParameters {
  type: 'retraction';
  extruderType?: 'direct_drive' | 'bowden' | 'high_speed';
  retractionSpeed?: number;  // mm/s
  testSpeed?: boolean;  // If true, vary speed instead of distance
  speedStart?: number;
  speedEnd?: number;
  speedStep?: number;
}

export class RetractionTowerGenerator extends TowerGeneratorBase {
  private retractionParams: RetractionTowerParameters;

  constructor(params: RetractionTowerParameters) {
    // Apply extruder type presets if specified
    if (params.extruderType && RETRACTION_PRESETS[params.extruderType]) {
      const preset = RETRACTION_PRESETS[params.extruderType];
      params = {
        ...params,
        startValue: params.startValue ?? preset.startDistance,
        endValue: params.endValue ?? preset.endDistance,
        stepSize: params.stepSize ?? preset.stepDistance,
        retractionSpeed: params.retractionSpeed ?? preset.speed
      };
    }

    // Set defaults specific to retraction towers
    const defaultParams: Partial<RetractionTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 1.0,  // 1mm per section for fine control
      towerWidth: 80,
      towerDepth: 10,
      retractionSpeed: 30,
      testSpeed: false,
      extruderType: 'direct_drive'
    };

    super({ ...defaultParams, ...params });
    this.retractionParams = { ...defaultParams, ...params } as RetractionTowerParameters;
  }

  protected formatLabel(value: number): string {
    if (this.retractionParams.testSpeed) {
      return `${value.toFixed(0)}mm/s`;
    }
    return `${value.toFixed(1)}mm`;
  }

  protected async generateTowerGeometry(): Promise<ParsedSTL> {
    try {
      // Load the OrcaSlicer retraction tower template
      const response = await fetch('/templates/retraction_tower_orca_ascii.stl');
      if (!response.ok) {
        throw new Error(`Failed to load retraction tower template: ${response.statusText}`);
      }
      
      const templateContent = await response.text();
      
      // Calculate the height we need based on sections
      const totalHeight = this.retractionParams.baseHeight! + (this.sections.length * this.retractionParams.sectionHeight!);
      
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
        name: 'RetractionTower',
        triangles
      };
    } catch (error) {
      console.error('Failed to generate retraction tower:', error);
      // Fallback to empty geometry
      return {
        name: 'RetractionTower',
        triangles: []
      };
    }
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const { testSpeed, retractionSpeed } = this.retractionParams;
    
    const modifierSettings = this.sections.map((section, index) => {
      const settings: Record<string, any> = {};
      
      if (testSpeed) {
        // Testing retraction speed
        settings['retraction_speed'] = section.value;
        settings['retraction_length'] = this.params.startValue;  // Keep distance constant
      } else {
        // Testing retraction distance
        settings['retraction_length'] = section.value;
        settings['retraction_speed'] = retractionSpeed;
      }
      
      // Add z-hop settings if needed
      settings['retraction_zhop'] = 0.2;  // Small z-hop to avoid stringing
      
      return {
        sectionIndex: index,
        settings
      };
    });

    return {
      calibrationType: 'retraction',
      parameters: {
        extruderType: this.retractionParams.extruderType,
        startValue: this.params.startValue,
        endValue: this.params.endValue,
        stepSize: this.params.stepSize,
        retractionSpeed: this.retractionParams.retractionSpeed,
        testSpeed: this.retractionParams.testSpeed,
        towerHeight: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!)
      },
      modifierSettings
    };
  }

  protected generateInstructions(): string {
    const { extruderType, startValue, endValue, stepSize, retractionSpeed, testSpeed } = this.retractionParams;
    
    return `## Retraction Tower Calibration

### Tower Configuration:
- Extruder Type: ${extruderType || 'Direct Drive'}
- ${testSpeed ? 'Speed' : 'Distance'} Range: ${startValue} to ${endValue} ${testSpeed ? 'mm/s' : 'mm'}
- Step Size: ${stepSize} ${testSpeed ? 'mm/s' : 'mm'}
- ${testSpeed ? 'Fixed Distance' : 'Fixed Speed'}: ${testSpeed ? startValue + 'mm' : retractionSpeed + 'mm/s'}
- Sections: ${this.sections.length}

### What to Look For:
1. **Stringing** - Fine wisps between tower pillars
2. **Blobs** - Excess material at layer changes
3. **Under-extrusion** - Gaps after retraction
4. **Print Quality** - Overall surface finish
5. **Grinding** - Listen for extruder clicking (too much retraction)

### Setup Instructions for OrcaSlicer:
1. Import the 3MF file
2. Settings are pre-configured with modifier meshes
3. Use your calibrated temperature
4. Print speed: 40-60mm/s
5. Enable retraction (will be overridden per section)

### Modifier Mesh Settings:
${this.sections.map((s, i) => `Section ${i + 1}: ${s.label} - Height ${s.height}mm`).join('\n')}

### How to Evaluate:
1. Find the lowest section with no stringing
2. Check that section has no under-extrusion
3. Verify no grinding sounds occurred
4. Use that retraction value

### Typical Values:
- **Direct Drive**: 0.2-2.0mm @ 30-40mm/s
- **Bowden**: 3.0-6.0mm @ 40-60mm/s  
- **High-Speed Direct**: 0.1-1.0mm @ 50-70mm/s

### Tips:
- Start with manufacturer recommendations
- Too much retraction causes grinding and clogs
- Too little causes stringing
- Speed affects both stringing and oozing
- Consider testing both distance and speed
`;
  }
}

/**
 * Convenience function to generate a retraction tower
 */
export async function generateRetractionTower(params: Partial<RetractionTowerParameters>) {
  const generator = new RetractionTowerGenerator({
    type: 'retraction',
    startValue: 0.2,
    endValue: 2.0,
    stepSize: 0.2,
    extruderType: 'direct_drive',
    ...params
  });
  
  return generator.generate();
}

/**
 * Generate and export retraction tower as 3MF with post-processing
 */
export async function generateRetractionTower3MF(
  params: Partial<RetractionTowerParameters>,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const tower = await generateRetractionTower(params);
  const extruderType = params.extruderType || 'direct_drive';
  
  return exportTowerAs3MF(
    tower,
    'retraction',
    `Retraction_Tower_${extruderType}`,
    firmware,
    includePostProcessing
  );
}