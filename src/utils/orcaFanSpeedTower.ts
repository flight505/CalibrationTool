/**
 * OrcaSlicer Fan Speed Tower Generator
 * Generates cooling fan calibration towers with bridging and overhang tests
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  generateTextMesh
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';

export interface FanSpeedTowerParameters extends OrcaTowerParameters {
  type: 'fan_speed';
  includeBridge?: boolean;
  includeOverhang?: boolean;
  includeStringingTest?: boolean;
  bridgeLength?: number;
  overhangAngles?: number[];
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
      includeStringingTest: true,
      bridgeLength: 20,
      overhangAngles: [30, 45, 60, 75]
    };

    super({ ...defaultParams, ...params });
    this.fanParams = { ...defaultParams, ...params } as FanSpeedTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${Math.round(value)}%`;
  }

  protected generateTowerGeometry(): ParsedSTL {
    const triangles: Triangle[] = [];
    const { baseHeight } = this.fanParams;
    
    // Calculate total height
    const totalHeight = baseHeight! + (this.sections.length * this.fanParams.sectionHeight!);
    
    // Generate main tower structure
    triangles.push(...this.generateMainStructure(totalHeight));
    
    // Add test features for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Add fan speed label
      if (this.params.includeLabels) {
        triangles.push(...this.generateSectionLabel(section, i));
      }
      
      // Add bridge test
      if (this.fanParams.includeBridge) {
        triangles.push(...this.generateBridgeTest(section.height, i));
      }
      
      // Add overhang test
      if (this.fanParams.includeOverhang) {
        triangles.push(...this.generateOverhangTest(section.height, i));
      }
      
      // Add stringing test pillars
      if (this.fanParams.includeStringingTest) {
        triangles.push(...this.generateStringingTest(section.height, i));
      }
    }
    
    return {
      name: 'FanSpeedTower',
      triangles
    };
  }

  private generateMainStructure(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.fanParams;
    const triangles: Triangle[] = [];
    
    // Create main tower body with cutouts for tests
    const halfWidth = towerWidth! / 2;
    const halfDepth = towerDepth! / 2;
    
    // Main body
    triangles.push(...this.createBoxTriangles(
      -halfWidth, halfWidth,
      -halfDepth, halfDepth,
      0, totalHeight
    ));
    
    // Create ventilation slots on the sides for better cooling test
    const slotWidth = 2;
    const slotSpacing = 5;
    const numSlots = Math.floor(towerWidth! / (slotWidth + slotSpacing));
    
    for (let i = 0; i < numSlots; i++) {
      const x = -halfWidth + (i + 0.5) * (slotWidth + slotSpacing);
      
      // Front slot
      triangles.push(...this.createBoxTriangles(
        x - slotWidth/2, x + slotWidth/2,
        halfDepth - 2, halfDepth + 0.1,
        this.fanParams.baseHeight!, totalHeight
      ));
      
      // Back slot
      triangles.push(...this.createBoxTriangles(
        x - slotWidth/2, x + slotWidth/2,
        -halfDepth - 0.1, -halfDepth + 2,
        this.fanParams.baseHeight!, totalHeight
      ));
    }
    
    return triangles;
  }

  private generateBridgeTest(sectionHeight: number, _sectionIndex: number): Triangle[] {
    const { towerWidth, bridgeLength, sectionHeight: secHeight } = this.fanParams;
    const triangles: Triangle[] = [];
    
    // Create bridge pillars with varying gaps
    const pillarWidth = 4;
    const pillarDepth = 4;
    const bridgeThickness = 1;
    const bridgeZ = sectionHeight + (secHeight! * 0.5);
    
    // Position bridges on the side of the tower
    const baseX = towerWidth! / 2 + 5;
    const gaps = [5, 10, 15, 20]; // Different bridge lengths to test
    
    let currentX = baseX;
    for (const gap of gaps) {
      if (gap > bridgeLength!) continue;
      
      // Left pillar
      triangles.push(...this.createBoxTriangles(
        currentX, currentX + pillarWidth,
        -pillarDepth / 2, pillarDepth / 2,
        sectionHeight, bridgeZ
      ));
      
      // Right pillar
      triangles.push(...this.createBoxTriangles(
        currentX + pillarWidth + gap, currentX + pillarWidth * 2 + gap,
        -pillarDepth / 2, pillarDepth / 2,
        sectionHeight, bridgeZ
      ));
      
      // Bridge
      triangles.push(...this.createBoxTriangles(
        currentX, currentX + pillarWidth * 2 + gap,
        -pillarDepth / 2, pillarDepth / 2,
        bridgeZ, bridgeZ + bridgeThickness
      ));
      
      currentX += pillarWidth * 2 + gap + 5;
    }
    
    return triangles;
  }

  private generateOverhangTest(sectionHeight: number, _sectionIndex: number): Triangle[] {
    const { towerDepth, overhangAngles, sectionHeight: secHeight } = this.fanParams;
    const triangles: Triangle[] = [];
    
    if (!overhangAngles || overhangAngles.length === 0) return triangles;
    
    // Create overhangs at different angles
    const overhangWidth = 4;
    const overhangHeight = secHeight! * 0.6;
    const startZ = sectionHeight + secHeight! * 0.2;
    
    for (let i = 0; i < overhangAngles.length; i++) {
      const angle = overhangAngles[i];
      const radians = (angle * Math.PI) / 180;
      const overhangDepth = overhangHeight * Math.tan(radians);
      
      const x = -20 + (i * (overhangWidth + 3));
      const y = -towerDepth! / 2 - 1;
      
      // Create angled overhang
      const vertices: Vertex[] = [
        { x: x, y: y, z: startZ },
        { x: x + overhangWidth, y: y, z: startZ },
        { x: x + overhangWidth, y: y - overhangDepth, z: startZ + overhangHeight },
        { x: x, y: y - overhangDepth, z: startZ + overhangHeight }
      ];
      
      // Bottom face
      triangles.push(
        {
          normal: { x: 0, y: -Math.cos(radians), z: -Math.sin(radians) },
          vertices: [vertices[0], vertices[2], vertices[1]]
        },
        {
          normal: { x: 0, y: -Math.cos(radians), z: -Math.sin(radians) },
          vertices: [vertices[0], vertices[3], vertices[2]]
        }
      );
      
      // Side faces
      triangles.push(
        {
          normal: { x: -1, y: 0, z: 0 },
          vertices: [vertices[0], { ...vertices[3], y: y }, vertices[3]]
        },
        {
          normal: { x: 1, y: 0, z: 0 },
          vertices: [vertices[1], vertices[2], { ...vertices[2], y: y }]
        }
      );
      
      // Back face
      triangles.push(
        {
          normal: { x: 0, y: 1, z: 0 },
          vertices: [vertices[2], vertices[3], { ...vertices[3], y: y }]
        },
        {
          normal: { x: 0, y: 1, z: 0 },
          vertices: [vertices[2], { ...vertices[3], y: y }, { ...vertices[2], y: y }]
        }
      );
    }
    
    return triangles;
  }

  private generateStringingTest(sectionHeight: number, _sectionIndex: number): Triangle[] {
    const { towerWidth, sectionHeight: secHeight } = this.fanParams;
    const triangles: Triangle[] = [];
    
    // Create small pillars for stringing test
    const pillarRadius = 1.5;
    const pillarHeight = secHeight! * 0.8;
    const numPillars = 5;
    const spacing = 8;
    
    const startX = -towerWidth! / 2 - 15;
    const startZ = sectionHeight + secHeight! * 0.1;
    
    for (let i = 0; i < numPillars; i++) {
      const x = startX - (i * spacing);
      const y = 0;
      
      // Create cylindrical pillar
      triangles.push(...this.createCylinderTriangles(
        x, y, startZ,
        pillarRadius, pillarHeight,
        16 // segments
      ));
    }
    
    return triangles;
  }

  private generateSectionLabel(section: { height: number; value: number; label: string }, _index: number): Triangle[] {
    const { towerWidth, towerDepth, sectionHeight } = this.fanParams;
    const triangles: Triangle[] = [];
    
    // Create label on the front face
    const labelWidth = 15;
    const labelHeight = 5;
    const labelDepth = 0.4;
    
    const labelX = towerWidth! / 2 - labelWidth - 5;
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
      4,
      0.3
    ));
    
    return triangles;
  }

  private createCylinderTriangles(
    x: number, y: number, z: number,
    radius: number, height: number,
    segments: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    const angleStep = (2 * Math.PI) / segments;
    
    for (let i = 0; i < segments; i++) {
      const angle1 = i * angleStep;
      const angle2 = (i + 1) * angleStep;
      
      const x1 = x + radius * Math.cos(angle1);
      const y1 = y + radius * Math.sin(angle1);
      const x2 = x + radius * Math.cos(angle2);
      const y2 = y + radius * Math.sin(angle2);
      
      const bottomV1: Vertex = { x: x1, y: y1, z: z };
      const bottomV2: Vertex = { x: x2, y: y2, z: z };
      const topV1: Vertex = { x: x1, y: y1, z: z + height };
      const topV2: Vertex = { x: x2, y: y2, z: z + height };
      const bottomCenter: Vertex = { x, y, z };
      const topCenter: Vertex = { x, y, z: z + height };
      
      // Bottom face
      triangles.push({
        normal: { x: 0, y: 0, z: -1 },
        vertices: [bottomCenter, bottomV2, bottomV1]
      });
      
      // Top face
      triangles.push({
        normal: { x: 0, y: 0, z: 1 },
        vertices: [topCenter, topV1, topV2]
      });
      
      // Side faces
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
    }
    
    return triangles;
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
    const baseInstructions = super.generateInstructions();
    
    const additionalInstructions = `
Fan Speed Tower Specific Instructions:
========================================

Fan Speed Range: ${this.params.startValue}% to ${this.params.endValue}%
Step: ${this.params.stepSize}%

Features to Evaluate:
1. Bridging Quality - Look for sagging or drooping
2. Overhang Performance - Check angles (30°, 45°, 60°, 75°)
3. Stringing - Check for wisps between pillars
4. Layer Adhesion - Too much cooling can cause delamination
5. Surface Quality - Look for warping or curling corners

OrcaSlicer Setup:
1. Import the main tower STL
2. For each fan speed section, add a modifier mesh
3. Set the fan speed for each modifier:
${this.sections.map((s, i) => `   Section ${i + 1}: ${s.label} fan speed`).join('\n')}

Recommended Print Settings:
- Layer Height: 0.2mm
- Print Temperature: Use your calibrated temperature
- Print Speed: 50-60mm/s
- No supports needed

Material-Specific Guidelines:
- PLA: Usually needs high cooling (80-100%)
- PETG: Moderate cooling (30-50%)
- ABS/ASA: Minimal cooling (0-30%)
- TPU: Low to no cooling (0-20%)

Tips:
- Start with manufacturer recommendations
- Too much cooling causes poor layer adhesion
- Too little cooling causes poor overhangs and bridges
- Different colors of same material may need different settings
`;

    return baseInstructions + additionalInstructions;
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