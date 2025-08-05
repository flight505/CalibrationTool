/**
 * OrcaSlicer Pressure Advance Tower Generator
 * Generates pressure advance/linear advance calibration towers
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  PA_PRESETS,
  generateTextMesh
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';

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
      
      // Outer square
      triangles.push(...this.createBoxTriangles(
        pos.x - outerSize / 2, pos.x + outerSize / 2,
        pos.y - outerSize / 2, pos.y + outerSize / 2,
        0, totalHeight
      ));
      
      // Inner cutout (hollow)
      triangles.push(...this.createInnerCutout(
        pos.x - innerSize / 2, pos.x + innerSize / 2,
        pos.y - innerSize / 2, pos.y + innerSize / 2,
        this.paParams.baseHeight!, totalHeight
      ));
    }
    
    // Add connecting base
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2, towerWidth! / 2,
      -towerDepth! / 2, towerDepth! / 2,
      0, this.paParams.baseHeight!
    ));
    
    return triangles;
  }

  private generateLineTestPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.paParams;
    const triangles: Triangle[] = [];
    
    // Create parallel lines with direction changes
    const lineSpacing = 4;
    const lineThickness = this.paParams.lineWidth! * 2;
    const numLines = Math.floor(towerWidth! / lineSpacing);
    
    for (let i = 0; i < numLines; i++) {
      const x = -towerWidth! / 2 + (i + 0.5) * lineSpacing;
      
      // Alternating line pattern for direction changes
      if (i % 2 === 0) {
        // Straight line
        triangles.push(...this.createBoxTriangles(
          x - lineThickness / 2, x + lineThickness / 2,
          -towerDepth! / 2, towerDepth! / 2,
          0, totalHeight
        ));
      } else {
        // Zigzag line
        const segments = 5;
        const segmentHeight = totalHeight / segments;
        
        for (let j = 0; j < segments; j++) {
          const yOffset = (j % 2 === 0) ? -towerDepth! / 4 : towerDepth! / 4;
          triangles.push(...this.createBoxTriangles(
            x - lineThickness / 2, x + lineThickness / 2,
            yOffset - lineThickness, yOffset + lineThickness,
            j * segmentHeight, (j + 1) * segmentHeight
          ));
        }
      }
    }
    
    return triangles;
  }

  private generateCombinedPattern(totalHeight: number): Triangle[] {
    const triangles: Triangle[] = [];
    const { towerWidth } = this.paParams;
    
    // Combine both patterns - corners on left, lines on right
    
    // Left side: corners
    const leftCorners = this.generateCornerTestPattern(totalHeight);
    const translatedLeft = this.translateTriangles(leftCorners, -towerWidth! / 4, 0, 0);
    triangles.push(...translatedLeft);
    
    // Right side: lines
    const rightLines = this.generateLineTestPattern(totalHeight);
    const translatedRight = this.translateTriangles(rightLines, towerWidth! / 4, 0, 0);
    triangles.push(...translatedRight);
    
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

  private translateTriangles(triangles: Triangle[], dx: number, dy: number, dz: number): Triangle[] {
    return triangles.map(tri => ({
      normal: tri.normal,
      vertices: tri.vertices.map(v => ({
        x: v.x + dx,
        y: v.y + dy,
        z: v.z + dz
      })) as [Vertex, Vertex, Vertex]
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