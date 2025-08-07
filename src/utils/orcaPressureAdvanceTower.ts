/**
 * OrcaSlicer Pressure Advance Tower Generator
 * Generates pressure advance/linear advance calibration towers
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  PA_PRESETS,
  generateTextMesh,
  GeneratedTower
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';
import { exportTowerAs3MF } from './orca3mfExporter';
import { FirmwareType } from './postProcessingGenerator';

export interface PressureAdvanceTowerParameters extends OrcaTowerParameters {
  type: 'pressure_advance';
  extruderType?: 'direct_drive' | 'bowden' | 'high_speed';
  testPattern?: 'corners' | 'lines' | 'combined';
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
      testPattern: 'corners',
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

  protected generateTowerGeometry(): ParsedSTL {
    const triangles: Triangle[] = [];
    const { baseHeight, testPattern } = this.paParams;
    
    // Calculate total height
    const totalHeight = baseHeight! + (this.sections.length * this.paParams.sectionHeight!);
    
    // Generate base structure based on test pattern
    if (testPattern === 'corners') {
      triangles.push(...this.generateCornerTestPattern(totalHeight));
    } else if (testPattern === 'lines') {
      triangles.push(...this.generateLineTestPattern(totalHeight));
    } else {
      triangles.push(...this.generateCombinedPattern(totalHeight));
    }
    
    // Add section labels
    if (this.params.includeLabels) {
      for (let i = 0; i < this.sections.length; i++) {
        triangles.push(...this.generateSectionLabel(this.sections[i], i));
      }
    }
    
    return {
      name: 'PressureAdvanceTower',
      triangles
    };
  }

  private generateCornerTestPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.paParams;
    const triangles: Triangle[] = [];
    
    // Add connecting base FIRST to ensure everything is supported
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2, towerWidth! / 2,
      -towerDepth! / 2, towerDepth! / 2,
      0, this.paParams.baseHeight!
    ));
    
    // Create a pattern with sharp corners to test PA
    const cornerSize = 15;
    const spacing = 5;
    
    // Generate corner test squares
    const positions = [
      { x: -towerWidth! / 2 + cornerSize / 2 + spacing, y: 0 },
      { x: 0, y: 0 },
      { x: towerWidth! / 2 - cornerSize / 2 - spacing, y: 0 }
    ];
    
    for (const pos of positions) {
      // Create hollow square with sharp corners
      const outerSize = cornerSize;
      const wallThickness = this.paParams.lineWidth! * 3; // 3 line widths
      const innerSize = outerSize - wallThickness * 2;
      
      // Outer square - start from base height (not from 0 to avoid Z-fighting with base)
      triangles.push(...this.createBoxTriangles(
        pos.x - outerSize / 2, pos.x + outerSize / 2,
        pos.y - outerSize / 2, pos.y + outerSize / 2,
        this.paParams.baseHeight!, totalHeight
      ));
      
      // Inner cutout (hollow) - also starts from base height
      if (innerSize > 0) {
        triangles.push(...this.createInnerCutout(
          pos.x - innerSize / 2, pos.x + innerSize / 2,
          pos.y - innerSize / 2, pos.y + innerSize / 2,
          this.paParams.baseHeight!, totalHeight
        ));
      }
    }
    
    return triangles;
  }

  private generateLineTestPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.paParams;
    const triangles: Triangle[] = [];
    
    // Create parallel lines with direction changes
    const lineSpacing = 4;
    const lineThickness = this.paParams.lineWidth! * 2;
    const numLines = Math.floor(towerWidth! / lineSpacing);
    
    // First, create a solid base plate to connect all lines
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2, towerWidth! / 2,
      -towerDepth! / 2, towerDepth! / 2,
      0, this.paParams.baseHeight!
    ));
    
    for (let i = 0; i < numLines; i++) {
      const x = -towerWidth! / 2 + (i + 0.5) * lineSpacing;
      
      // All lines are now continuous vertical walls
      if (i % 2 === 0) {
        // Straight line - continuous wall from base to top
        triangles.push(...this.createBoxTriangles(
          x - lineThickness / 2, x + lineThickness / 2,
          -towerDepth! / 2, towerDepth! / 2,
          0, totalHeight
        ));
      } else {
        // Create a zigzag pattern with connected segments
        const zigzagAmplitude = towerDepth! / 4;
        const zigzagPeriods = 5;
        const segmentHeight = totalHeight / (zigzagPeriods * 2);
        
        // Create connected zigzag segments
        for (let j = 0; j < zigzagPeriods * 2; j++) {
          const zStart = j * segmentHeight;
          const zEnd = (j + 1) * segmentHeight;
          const isForward = (j % 2 === 0);
          
          if (j === 0) {
            // First segment connects from center to one side
            const yStart = 0;
            const yEnd = isForward ? zigzagAmplitude : -zigzagAmplitude;
            
            // Create a slanted wall segment
            triangles.push(...this.createSlantedWall(
              x - lineThickness / 2, x + lineThickness / 2,
              yStart, yEnd,
              zStart, zEnd
            ));
          } else {
            // Subsequent segments connect between alternating positions
            const yStart = ((j - 1) % 2 === 0) ? zigzagAmplitude : -zigzagAmplitude;
            const yEnd = isForward ? zigzagAmplitude : -zigzagAmplitude;
            
            // Create a slanted wall segment
            triangles.push(...this.createSlantedWall(
              x - lineThickness / 2, x + lineThickness / 2,
              yStart, yEnd,
              zStart, zEnd
            ));
          }
        }
      }
    }
    
    return triangles;
  }
  
  private createSlantedWall(
    minX: number, maxX: number,
    yStart: number, yEnd: number,
    zStart: number, zEnd: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    
    // Create vertices for the slanted wall
    const vertices: Vertex[] = [
      // Bottom vertices
      { x: minX, y: yStart, z: zStart },
      { x: maxX, y: yStart, z: zStart },
      { x: maxX, y: yEnd, z: zEnd },
      { x: minX, y: yEnd, z: zEnd },
      // Top face (same as bottom for a wall)
      { x: minX, y: yStart, z: zStart },
      { x: maxX, y: yStart, z: zStart },
      { x: maxX, y: yEnd, z: zEnd },
      { x: minX, y: yEnd, z: zEnd }
    ];
    
    // Front face
    triangles.push(
      { normal: { x: 0, y: 0, z: 1 }, vertices: [vertices[0], vertices[1], vertices[2]] },
      { normal: { x: 0, y: 0, z: 1 }, vertices: [vertices[0], vertices[2], vertices[3]] }
    );
    
    // Back face  
    triangles.push(
      { normal: { x: 0, y: 0, z: -1 }, vertices: [vertices[1], vertices[0], vertices[3]] },
      { normal: { x: 0, y: 0, z: -1 }, vertices: [vertices[1], vertices[3], vertices[2]] }
    );
    
    // Left face
    triangles.push(
      { normal: { x: -1, y: 0, z: 0 }, vertices: [vertices[0], vertices[3], vertices[2]] },
      { normal: { x: -1, y: 0, z: 0 }, vertices: [vertices[0], vertices[2], vertices[1]] }
    );
    
    // Right face
    triangles.push(
      { normal: { x: 1, y: 0, z: 0 }, vertices: [vertices[2], vertices[3], vertices[0]] },
      { normal: { x: 1, y: 0, z: 0 }, vertices: [vertices[2], vertices[0], vertices[1]] }
    );
    
    return triangles;
  }

  private generateCombinedPattern(totalHeight: number): Triangle[] {
    const triangles: Triangle[] = [];
    const { towerWidth, towerDepth } = this.paParams;
    
    // First, create a common base plate for everything
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2, towerWidth! / 2,
      -towerDepth! / 2, towerDepth! / 2,
      0, this.paParams.baseHeight!
    ));
    
    // Left side: simplified corner test (single corner box)
    const cornerSize = 15;
    const wallThickness = this.paParams.lineWidth! * 3;
    const leftX = -towerWidth! / 3;
    
    // Outer corner box
    triangles.push(...this.createBoxTriangles(
      leftX - cornerSize / 2, leftX + cornerSize / 2,
      -cornerSize / 2, cornerSize / 2,
      this.paParams.baseHeight!, totalHeight
    ));
    
    // Inner cutout for hollow corner
    const innerSize = cornerSize - wallThickness * 2;
    triangles.push(...this.createInnerCutout(
      leftX - innerSize / 2, leftX + innerSize / 2,
      -innerSize / 2, innerSize / 2,
      this.paParams.baseHeight!, totalHeight
    ));
    
    // Right side: simplified line test (straight lines only for combined pattern)
    const lineSpacing = 4;
    const lineThickness = this.paParams.lineWidth! * 2;
    const startX = towerWidth! / 6;
    const numLines = 3; // Fewer lines for combined pattern
    
    for (let i = 0; i < numLines; i++) {
      const x = startX + i * lineSpacing;
      
      // All straight lines in combined pattern for simplicity
      triangles.push(...this.createBoxTriangles(
        x - lineThickness / 2, x + lineThickness / 2,
        -towerDepth! / 3, towerDepth! / 3,
        this.paParams.baseHeight!, totalHeight
      ));
    }
    
    return triangles;
  }

  private createInnerCutout(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    // Create inverted normals for inner cutout
    const triangles = this.createBoxTriangles(minX, maxX, minY, maxY, minZ, maxZ);
    
    // Reverse triangle winding to invert normals
    return triangles.map(tri => ({
      normal: { x: -tri.normal.x, y: -tri.normal.y, z: -tri.normal.z },
      vertices: [tri.vertices[2], tri.vertices[1], tri.vertices[0]] as [Vertex, Vertex, Vertex]
    }));
  }


  private generateSectionLabel(section: { height: number; value: number; label: string }, _index: number): Triangle[] {
    const { towerDepth, sectionHeight } = this.paParams;
    const triangles: Triangle[] = [];
    
    // Create a recessed area for the label
    const labelWidth = 25;
    const labelHeight = 4;
    const labelDepth = 0.4;
    
    const labelX = 0; // Center
    const labelY = towerDepth! / 2 - 0.1; // Front face
    const labelZ = section.height + (sectionHeight! / 2);
    
    // Create recessed box for label background
    triangles.push(...this.createBoxTriangles(
      labelX - labelWidth/2, labelX + labelWidth/2,
      labelY - labelDepth, labelY,
      labelZ - labelHeight/2, labelZ + labelHeight/2
    ));
    
    // Add text (placeholder)
    triangles.push(...generateTextMesh(
      section.label,
      { x: labelX, y: labelY, z: labelZ },
      3,
      0.2
    ));
    
    return triangles;
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

  protected generateInstructions(): string {
    const baseInstructions = super.generateInstructions();
    
    const additionalInstructions = `
Pressure Advance Tower Specific Instructions:
==============================================

Extruder Type: ${this.paParams.extruderType || 'Not specified'}
PA Range: ${this.params.startValue} to ${this.params.endValue}
Step: ${this.params.stepSize}
Test Pattern: ${this.paParams.testPattern}

What to Look For:
1. Corner Quality - Sharp corners without bulging
2. Line Consistency - Even width throughout direction changes
3. No Gaps - Consistent extrusion at acceleration points
4. No Blobs - Clean starts and stops

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