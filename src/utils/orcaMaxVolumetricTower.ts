/**
 * OrcaSlicer Max Volumetric Speed Tower Generator
 * Generates towers to determine maximum hotend flow capacity
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  generateTextMesh
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';

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

  protected generateTowerGeometry(): ParsedSTL {
    const triangles: Triangle[] = [];
    const { baseHeight } = this.volumetricParams;
    
    // Calculate total height
    const totalHeight = baseHeight! + (this.sections.length * this.volumetricParams.sectionHeight!);
    
    // Generate test structure based on pattern
    if (this.volumetricParams.testPattern === 'spiral') {
      triangles.push(...this.generateSpiralPattern(totalHeight));
    } else if (this.volumetricParams.testPattern === 'zigzag') {
      triangles.push(...this.generateZigzagPattern(totalHeight));
    } else {
      triangles.push(...this.generateStraightPattern(totalHeight));
    }
    
    // Add section markers and labels
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Add volumetric speed label
      if (this.params.includeLabels) {
        triangles.push(...this.generateSectionLabel(section, i));
      }
      
      // Add section divider
      triangles.push(...this.generateSectionDivider(section.height));
    }
    
    return {
      name: 'MaxVolumetricTower',
      triangles
    };
  }

  private generateSpiralPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.volumetricParams;
    const triangles: Triangle[] = [];
    
    // Create a spiral vase mode style tower
    const outerRadius = Math.min(towerWidth!, towerDepth!) / 2;
    const innerRadius = outerRadius - 3; // 3mm wall thickness
    const segments = 64;
    
    // Generate cylinder with spiral internal structure
    triangles.push(...this.generateCylinder(0, 0, 0, outerRadius, totalHeight, segments));
    
    // Create hollow interior
    triangles.push(...this.generateInnerCylinder(0, 0, this.volumetricParams.baseHeight!, innerRadius, totalHeight - this.volumetricParams.baseHeight!, segments));
    
    // Add spiral ramp inside for continuous flow test
    if (this.volumetricParams.includeInfill) {
      triangles.push(...this.generateSpiralRamp(innerRadius, totalHeight));
    }
    
    return triangles;
  }

  private generateZigzagPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.volumetricParams;
    const triangles: Triangle[] = [];
    
    // Create zigzag walls for rapid direction changes
    const wallThickness = 2;
    const zigzagAmplitude = 8;
    const zigzagPeriod = 10;
    const numZigzags = Math.floor(towerWidth! / zigzagPeriod);
    
    // Base platform
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2, towerWidth! / 2,
      -towerDepth! / 2, towerDepth! / 2,
      0, this.volumetricParams.baseHeight!
    ));
    
    // Generate zigzag walls
    for (let i = 0; i < numZigzags; i++) {
      const x = -towerWidth! / 2 + (i + 0.5) * zigzagPeriod;
      
      for (let j = 0; j < 4; j++) {
        const y1 = -towerDepth! / 2 + j * (towerDepth! / 4);
        const y2 = y1 + (j % 2 === 0 ? zigzagAmplitude : -zigzagAmplitude);
        
        // Diagonal wall segment
        triangles.push(...this.createDiagonalWall(
          x, x + zigzagPeriod / 2,
          y1, y2,
          wallThickness,
          this.volumetricParams.baseHeight!, totalHeight
        ));
      }
    }
    
    return triangles;
  }

  private generateStraightPattern(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth, includeInfill, infillPercentage } = this.volumetricParams;
    const triangles: Triangle[] = [];
    
    // Simple box tower for straight line speed tests
    const halfWidth = towerWidth! / 2;
    const halfDepth = towerDepth! / 2;
    
    // Outer walls
    triangles.push(...this.createBoxTriangles(
      -halfWidth, halfWidth,
      -halfDepth, halfDepth,
      0, totalHeight
    ));
    
    // Inner cavity
    const wallThickness = 2;
    triangles.push(...this.createInnerCavity(
      -halfWidth + wallThickness, halfWidth - wallThickness,
      -halfDepth + wallThickness, halfDepth - wallThickness,
      this.volumetricParams.baseHeight!, totalHeight
    ));
    
    // Add infill grid if enabled
    if (includeInfill && infillPercentage! > 0) {
      triangles.push(...this.generateInfillGrid(
        -halfWidth + wallThickness, halfWidth - wallThickness,
        -halfDepth + wallThickness, halfDepth - wallThickness,
        this.volumetricParams.baseHeight!, totalHeight,
        infillPercentage!
      ));
    }
    
    return triangles;
  }

  private generateCylinder(x: number, y: number, z: number, radius: number, height: number, segments: number): Triangle[] {
    const triangles: Triangle[] = [];
    const angleStep = (2 * Math.PI) / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle1 = i * angleStep;
      const angle2 = ((i + 1) % segments) * angleStep;
      
      const x1 = x + radius * Math.cos(angle1);
      const y1 = y + radius * Math.sin(angle1);
      const x2 = x + radius * Math.cos(angle2);
      const y2 = y + radius * Math.sin(angle2);
      
      const bottomV1: Vertex = { x: x1, y: y1, z: z };
      const bottomV2: Vertex = { x: x2, y: y2, z: z };
      const topV1: Vertex = { x: x1, y: y1, z: z + height };
      const topV2: Vertex = { x: x2, y: y2, z: z + height };
      
      // Side face
      const nx = (Math.cos(angle1) + Math.cos(angle2)) / 2;
      const ny = (Math.sin(angle1) + Math.sin(angle2)) / 2;
      
      triangles.push(
        {
          normal: { x: nx, y: ny, z: 0 },
          vertices: [bottomV1, bottomV2, topV2]
        },
        {
          normal: { x: nx, y: ny, z: 0 },
          vertices: [bottomV1, topV2, topV1]
        }
      );
      
      // Bottom cap
      triangles.push({
        normal: { x: 0, y: 0, z: -1 },
        vertices: [{ x, y, z }, bottomV2, bottomV1]
      });
      
      // Top cap
      triangles.push({
        normal: { x: 0, y: 0, z: 1 },
        vertices: [{ x, y, z: z + height }, topV1, topV2]
      });
    }
    
    return triangles;
  }

  private generateInnerCylinder(x: number, y: number, z: number, radius: number, height: number, segments: number): Triangle[] {
    // Generate cylinder with inverted normals for cavity
    const triangles = this.generateCylinder(x, y, z, radius, height, segments);
    
    // Invert normals
    return triangles.map(tri => ({
      normal: { x: -tri.normal.x, y: -tri.normal.y, z: -tri.normal.z },
      vertices: [tri.vertices[2], tri.vertices[1], tri.vertices[0]] as [Vertex, Vertex, Vertex]
    }));
  }

  private generateSpiralRamp(radius: number, totalHeight: number): Triangle[] {
    const triangles: Triangle[] = [];
    const rampWidth = 2;
    const turnsPerHeight = 0.5; // Half turn per section
    const segments = 32;
    
    const totalTurns = turnsPerHeight * (totalHeight / this.volumetricParams.sectionHeight!);
    const heightPerSegment = totalHeight / (segments * totalTurns);
    
    for (let i = 0; i < segments * totalTurns; i++) {
      const angle1 = (i / segments) * 2 * Math.PI;
      const angle2 = ((i + 1) / segments) * 2 * Math.PI;
      const z1 = i * heightPerSegment;
      const z2 = (i + 1) * heightPerSegment;
      
      if (z2 > totalHeight) break;
      
      const innerR = radius - rampWidth;
      
      const v1: Vertex = { x: innerR * Math.cos(angle1), y: innerR * Math.sin(angle1), z: z1 };
      const v2: Vertex = { x: radius * Math.cos(angle1), y: radius * Math.sin(angle1), z: z1 };
      const v3: Vertex = { x: radius * Math.cos(angle2), y: radius * Math.sin(angle2), z: z2 };
      const v4: Vertex = { x: innerR * Math.cos(angle2), y: innerR * Math.sin(angle2), z: z2 };
      
      // Top surface of ramp
      triangles.push(
        {
          normal: { x: 0, y: 0, z: 1 },
          vertices: [v1, v2, v3]
        },
        {
          normal: { x: 0, y: 0, z: 1 },
          vertices: [v1, v3, v4]
        }
      );
    }
    
    return triangles;
  }

  private generateInfillGrid(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number,
    percentage: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    const spacing = 10 * (100 / percentage); // Adjust spacing based on percentage
    const wallThickness = 0.8;
    
    // X-direction walls
    for (let x = minX + spacing; x < maxX; x += spacing) {
      triangles.push(...this.createBoxTriangles(
        x - wallThickness / 2, x + wallThickness / 2,
        minY, maxY,
        minZ, maxZ
      ));
    }
    
    // Y-direction walls
    for (let y = minY + spacing; y < maxY; y += spacing) {
      triangles.push(...this.createBoxTriangles(
        minX, maxX,
        y - wallThickness / 2, y + wallThickness / 2,
        minZ, maxZ
      ));
    }
    
    return triangles;
  }

  private createDiagonalWall(
    x1: number, x2: number,
    y1: number, y2: number,
    thickness: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    
    // Calculate perpendicular direction for thickness
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / length * thickness / 2;
    const perpY = dx / length * thickness / 2;
    
    const vertices: Vertex[] = [
      { x: x1 - perpX, y: y1 - perpY, z: minZ },
      { x: x1 + perpX, y: y1 + perpY, z: minZ },
      { x: x2 + perpX, y: y2 + perpY, z: minZ },
      { x: x2 - perpX, y: y2 - perpY, z: minZ },
      { x: x1 - perpX, y: y1 - perpY, z: maxZ },
      { x: x1 + perpX, y: y1 + perpY, z: maxZ },
      { x: x2 + perpX, y: y2 + perpY, z: maxZ },
      { x: x2 - perpX, y: y2 - perpY, z: maxZ }
    ];
    
    // Create box from vertices
    // Bottom, top, and four sides
    const faces = [
      [0, 1, 2, 3], // bottom
      [4, 7, 6, 5], // top
      [0, 3, 7, 4], // side 1
      [1, 5, 6, 2], // side 2
      [0, 4, 5, 1], // end 1
      [3, 2, 6, 7]  // end 2
    ];
    
    for (const face of faces) {
      triangles.push(
        {
          normal: { x: 0, y: 0, z: face[0] < 4 ? -1 : 1 },
          vertices: [vertices[face[0]], vertices[face[1]], vertices[face[2]]]
        },
        {
          normal: { x: 0, y: 0, z: face[0] < 4 ? -1 : 1 },
          vertices: [vertices[face[0]], vertices[face[2]], vertices[face[3]]]
        }
      );
    }
    
    return triangles;
  }

  private createInnerCavity(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    const triangles = this.createBoxTriangles(minX, maxX, minY, maxY, minZ, maxZ);
    
    // Invert normals for cavity
    return triangles.map(tri => ({
      normal: { x: -tri.normal.x, y: -tri.normal.y, z: -tri.normal.z },
      vertices: [tri.vertices[2], tri.vertices[1], tri.vertices[0]] as [Vertex, Vertex, Vertex]
    }));
  }

  private generateSectionDivider(height: number): Triangle[] {
    const { towerWidth, towerDepth } = this.volumetricParams;
    const triangles: Triangle[] = [];
    
    // Add a thin horizontal line/ridge to mark section boundaries
    const ridgeHeight = 0.4;
    const ridgeDepth = 1;
    
    triangles.push(...this.createBoxTriangles(
      -towerWidth! / 2 - ridgeDepth, towerWidth! / 2 + ridgeDepth,
      -towerDepth! / 2 - ridgeDepth, towerDepth! / 2 + ridgeDepth,
      height - ridgeHeight / 2, height + ridgeHeight / 2
    ));
    
    return triangles;
  }

  private generateSectionLabel(section: { height: number; value: number; label: string }, _index: number): Triangle[] {
    const { towerDepth, sectionHeight } = this.volumetricParams;
    const triangles: Triangle[] = [];
    
    // Create label
    const labelWidth = 20;
    const labelHeight = 5;
    const labelDepth = 0.4;
    
    const labelX = 0;
    const labelY = towerDepth! / 2 - 0.1;
    const labelZ = section.height + (sectionHeight! / 2);
    
    // Create recessed area
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
    const { layerHeight, lineWidth } = this.volumetricParams;
    
    const settings: OrcaSlicerSettings = {
      calibrationType: 'max_volumetric_speed',
      parameters: {
        start_volumetric: this.params.startValue,
        end_volumetric: this.params.endValue,
        volumetric_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        layer_height: layerHeight,
        line_width: lineWidth,
        nozzle_size: this.volumetricParams.nozzleSize,
        test_pattern: this.volumetricParams.testPattern
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Calculate print speed from volumetric speed
      // Volumetric Speed = Layer Height × Line Width × Print Speed
      const printSpeed = section.value / (layerHeight! * lineWidth!);
      
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'max_volumetric_speed': section.value,
          'outer_wall_speed': Math.min(printSpeed * 0.5, 100), // 50% for outer walls
          'inner_wall_speed': Math.min(printSpeed * 0.7, 150),  // 70% for inner walls
          'sparse_infill_speed': printSpeed,
          'internal_solid_infill_speed': Math.min(printSpeed * 0.8, 200)
        }
      });
    }

    return settings;
  }

  protected generateInstructions(): string {
    const baseInstructions = super.generateInstructions();
    const { layerHeight, lineWidth } = this.volumetricParams;
    
    const additionalInstructions = `
Max Volumetric Speed Tower Instructions:
==========================================

Volumetric Speed Range: ${this.params.startValue} to ${this.params.endValue} mm³/s
Step: ${this.params.stepSize} mm³/s
Layer Height: ${layerHeight}mm
Line Width: ${lineWidth}mm
Test Pattern: ${this.volumetricParams.testPattern}

What to Look For:
1. Under-Extrusion - Gaps, missing layers, poor adhesion
2. Skipping Steps - Motor skipping at high speeds
3. Heat Creep - Filament jamming from insufficient cooling
4. Surface Quality - Roughness or irregularities
5. Layer Adhesion - Delamination at high speeds

How to Identify Maximum:
- Find the highest speed section with:
  • No under-extrusion
  • Consistent layer adhesion
  • No motor skipping
  • Good surface quality

OrcaSlicer Setup:
1. Import the main tower STL
2. For each volumetric speed section, add a modifier mesh
3. Set the max volumetric speed for each modifier:
${this.sections.map((s, i) => {
  const speed = s.value / (layerHeight! * lineWidth!);
  return `   Section ${i + 1}: ${s.label} (≈${speed.toFixed(0)}mm/s print speed)`;
}).join('\n')}

Print Speed Calculation:
Print Speed = Volumetric Speed ÷ (Layer Height × Line Width)
Example: ${this.params.startValue} mm³/s ÷ (${layerHeight}mm × ${lineWidth}mm) = ${(this.params.startValue / (layerHeight! * lineWidth!)).toFixed(0)}mm/s

Recommended Settings:
- Temperature: Use maximum safe temperature for material
- Cooling: Minimal (to maintain temperature)
- Retraction: Disabled or minimal
- Z-hop: Disabled

Hotend Capacity Guidelines:
- Standard V6: 10-15 mm³/s
- Volcano: 20-30 mm³/s
- CHT Nozzle: 25-35 mm³/s
- Dragon HF: 30-40 mm³/s
- Mosquito Magnum: 35-45 mm³/s

Tips:
- Start conservative and work up
- Different materials have different limits
- Nozzle temperature affects max flow
- Larger nozzles allow higher volumetric speeds
- Use result as safety limit (80% of max)
`;

    return baseInstructions + additionalInstructions;
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