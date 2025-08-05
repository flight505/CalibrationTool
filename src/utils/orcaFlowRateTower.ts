/**
 * OrcaSlicer Flow Rate Tower Generator
 * Generates flow ratio/multiplier calibration towers
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  generateTextMesh
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';

export interface FlowRateTowerParameters extends OrcaTowerParameters {
  type: 'flow_rate';
  wallThickness?: number;
  includeTopSurface?: boolean;
  includeThinWalls?: boolean;
  nozzleSize?: number;
}

export class FlowRateTowerGenerator extends TowerGeneratorBase {
  private flowParams: FlowRateTowerParameters;

  constructor(params: FlowRateTowerParameters) {
    // Set defaults specific to flow rate towers
    const defaultParams: Partial<FlowRateTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 8.0,
      towerWidth: 30,
      towerDepth: 30,
      startValue: 0.90,   // 90% flow
      endValue: 1.10,     // 110% flow
      stepSize: 0.05,     // 5% increments
      wallThickness: 1.2, // 3 perimeters for 0.4mm nozzle
      includeTopSurface: true,
      includeThinWalls: true,
      nozzleSize: 0.4
    };

    super({ ...defaultParams, ...params });
    this.flowParams = { ...defaultParams, ...params } as FlowRateTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${(value * 100).toFixed(0)}%`;
  }

  protected generateTowerGeometry(): ParsedSTL {
    const triangles: Triangle[] = [];
    const { baseHeight } = this.flowParams;
    
    // Calculate total height
    const totalHeight = baseHeight! + (this.sections.length * this.flowParams.sectionHeight!);
    
    // Generate main calibration structure
    triangles.push(...this.generateCalibrationStructure(totalHeight));
    
    // Add section features
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Add flow rate label
      if (this.params.includeLabels) {
        triangles.push(...this.generateSectionLabel(section, i));
      }
      
      // Add top surface test patch
      if (this.flowParams.includeTopSurface && i === this.sections.length - 1) {
        triangles.push(...this.generateTopSurfaceTest(section.height));
      }
    }
    
    return {
      name: 'FlowRateTower',
      triangles
    };
  }

  private generateCalibrationStructure(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth, wallThickness, includeThinWalls } = this.flowParams;
    const triangles: Triangle[] = [];
    
    // Main structure - hollow cube with specific wall thickness
    const halfWidth = towerWidth! / 2;
    const halfDepth = towerDepth! / 2;
    
    // Outer walls
    triangles.push(...this.createBoxTriangles(
      -halfWidth, halfWidth,
      -halfDepth, halfDepth,
      0, totalHeight
    ));
    
    // Inner cavity (hollow interior)
    const innerWallOffset = wallThickness!;
    triangles.push(...this.createInnerCavity(
      -halfWidth + innerWallOffset, halfWidth - innerWallOffset,
      -halfDepth + innerWallOffset, halfDepth - innerWallOffset,
      this.flowParams.baseHeight!, totalHeight
    ));
    
    // Add thin wall test structures
    if (includeThinWalls) {
      triangles.push(...this.generateThinWallTests(totalHeight));
    }
    
    // Add measurement notches for caliper measurement
    triangles.push(...this.generateMeasurementNotches(totalHeight));
    
    return triangles;
  }

  private generateThinWallTests(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth, nozzleSize } = this.flowParams;
    const triangles: Triangle[] = [];
    
    // Create thin walls of exactly 1 nozzle width
    const thinWallThickness = nozzleSize!;
    const wallLength = 10;
    
    // Position thin walls on corners
    const positions = [
      { x: towerWidth! / 2 + 5, y: 0 },
      { x: -towerWidth! / 2 - 5 - wallLength, y: 0 },
      { x: 0, y: towerDepth! / 2 + 5 },
      { x: 0, y: -towerDepth! / 2 - 5 - wallLength }
    ];
    
    for (const pos of positions) {
      if (pos.x !== 0) {
        // Vertical wall along X axis
        triangles.push(...this.createBoxTriangles(
          pos.x, pos.x + wallLength,
          pos.y - thinWallThickness / 2, pos.y + thinWallThickness / 2,
          this.flowParams.baseHeight!, totalHeight
        ));
      } else {
        // Vertical wall along Y axis
        triangles.push(...this.createBoxTriangles(
          pos.x - thinWallThickness / 2, pos.x + thinWallThickness / 2,
          pos.y, pos.y + wallLength,
          this.flowParams.baseHeight!, totalHeight
        ));
      }
    }
    
    return triangles;
  }

  private generateMeasurementNotches(_totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.flowParams;
    const triangles: Triangle[] = [];
    
    // Add small notches at each section height for easy measurement
    const notchDepth = 0.5;
    const notchWidth = 2;
    
    for (let i = 0; i < this.sections.length; i++) {
      const z = this.sections[i].height;
      
      // Front face notch
      triangles.push(...this.createBoxTriangles(
        -notchWidth / 2, notchWidth / 2,
        towerDepth! / 2 - notchDepth, towerDepth! / 2 + 0.1,
        z - 0.2, z + 0.2
      ));
      
      // Side face notch
      triangles.push(...this.createBoxTriangles(
        towerWidth! / 2 - notchDepth, towerWidth! / 2 + 0.1,
        -notchWidth / 2, notchWidth / 2,
        z - 0.2, z + 0.2
      ));
    }
    
    return triangles;
  }

  private generateTopSurfaceTest(baseZ: number): Triangle[] {
    const { towerWidth, towerDepth, sectionHeight } = this.flowParams;
    const triangles: Triangle[] = [];
    
    // Create a solid top surface for ironing/top surface quality test
    const surfaceThickness = 2; // 10 layers at 0.2mm
    const inset = 5;
    
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2 + inset, towerWidth! / 2 - inset,
      -towerDepth! / 2 + inset, towerDepth! / 2 - inset,
      baseZ + sectionHeight! - surfaceThickness, baseZ + sectionHeight!
    ));
    
    return triangles;
  }

  private createInnerCavity(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    // Create inverted normals for inner cavity
    const triangles = this.createBoxTriangles(minX, maxX, minY, maxY, minZ, maxZ);
    
    // Reverse triangle winding to invert normals
    return triangles.map(tri => ({
      normal: { x: -tri.normal.x, y: -tri.normal.y, z: -tri.normal.z },
      vertices: [tri.vertices[2], tri.vertices[1], tri.vertices[0]] as [Vertex, Vertex, Vertex]
    }));
  }

  private generateSectionLabel(section: { height: number; value: number; label: string }, _index: number): Triangle[] {
    const { towerDepth, sectionHeight } = this.flowParams;
    const triangles: Triangle[] = [];
    
    // Create label on the front face
    const labelWidth = 12;
    const labelHeight = 4;
    const labelDepth = 0.3;
    
    const labelX = 0;
    const labelY = towerDepth! / 2 - 0.1;
    const labelZ = section.height + (sectionHeight! / 2);
    
    // Create recessed area for label
    triangles.push(...this.createBoxTriangles(
      labelX - labelWidth/2, labelX + labelWidth/2,
      labelY - labelDepth, labelY,
      labelZ - labelHeight/2, labelZ + labelHeight/2
    ));
    
    // Add text
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
      calibrationType: 'flow_rate',
      parameters: {
        start_flow: this.params.startValue,
        end_flow: this.params.endValue,
        flow_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        wall_thickness: this.flowParams.wallThickness,
        nozzle_size: this.flowParams.nozzleSize,
        include_thin_walls: this.flowParams.includeThinWalls
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
    const baseInstructions = super.generateInstructions();
    
    const additionalInstructions = `
Flow Rate Tower Specific Instructions:
========================================

Flow Rate Range: ${(this.params.startValue * 100).toFixed(0)}% to ${(this.params.endValue * 100).toFixed(0)}%
Step: ${(this.params.stepSize * 100).toFixed(0)}%
Wall Thickness: ${this.flowParams.wallThickness}mm
Nozzle Size: ${this.flowParams.nozzleSize}mm

How to Measure:
1. Use calipers to measure wall thickness at each section
2. Compare measured thickness to expected (${this.flowParams.wallThickness}mm)
3. Look for the section with most accurate dimensions
4. Check thin wall quality (should be exactly ${this.flowParams.nozzleSize}mm)

What to Look For:
1. Wall Dimension Accuracy - Measure with calipers
2. Surface Quality - No gaps or over-extrusion
3. Corner Quality - Sharp, well-defined corners
4. Thin Wall Consistency - Even width throughout
5. Top Surface - Smooth and even (if enabled)

OrcaSlicer Setup:
1. Import the main tower STL
2. For each flow rate section, add a modifier mesh
3. Set the flow ratio for each modifier:
${this.sections.map((s, i) => `   Section ${i + 1}: ${s.label} flow ratio (${s.value.toFixed(2)})`).join('\n')}

Recommended Print Settings:
- Layer Height: 0.2mm
- Wall Loops: 3 (for ${this.flowParams.wallThickness}mm walls)
- Infill: 20-30%
- Print Speed: Your normal speed
- Temperature: Your calibrated temperature

Calculation Formula:
New Flow Ratio = Current Flow × (Expected Width / Measured Width)

Example:
- Expected: ${this.flowParams.wallThickness}mm
- Measured: 1.25mm
- Current Flow: 1.00
- New Flow = 1.00 × (${this.flowParams.wallThickness}/1.25) = ${(this.flowParams.wallThickness! / 1.25).toFixed(3)}

Tips:
- Measure multiple points and average
- Check both X and Y wall dimensions
- Thin walls help verify single-line extrusion
- Different colors may need different flow rates
`;

    return baseInstructions + additionalInstructions;
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