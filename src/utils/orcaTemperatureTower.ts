/**
 * OrcaSlicer Temperature Tower Generator
 * Generates temperature calibration towers with labeled sections
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  MATERIAL_TEMP_PRESETS,
  createCylinderMesh,
  generateTextMesh
} from './orcaTowerGenerator';
import { ParsedSTL, Triangle, Vertex } from './asciiStlUtils';

export interface TemperatureTowerParameters extends OrcaTowerParameters {
  type: 'temperature';
  includeBridge?: boolean;
  includeOverhang?: boolean;
  bridgeGap?: number;
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
    const defaultParams: Partial<TemperatureTowerParameters> = {
      baseHeight: 1.0,
      sectionHeight: 10.0,
      towerWidth: 40,
      towerDepth: 15,
      includeBridge: true,
      includeOverhang: true,
      bridgeGap: 10
    };

    super({ ...defaultParams, ...params });
    this.tempParams = { ...defaultParams, ...params } as TemperatureTowerParameters;
  }

  protected formatLabel(value: number): string {
    return `${Math.round(value)}°C`;
  }

  protected generateTowerGeometry(): ParsedSTL {
    const triangles: Triangle[] = [];
    const { baseHeight, includeBridge, includeOverhang } = this.tempParams;
    
    // Calculate total height
    const totalHeight = baseHeight! + (this.sections.length * this.tempParams.sectionHeight!);
    
    // Generate main tower body
    triangles.push(...this.generateMainBody(totalHeight));
    
    // Add features for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Add temperature label
      if (this.params.includeLabels) {
        triangles.push(...this.generateSectionLabel(section, i));
      }
      
      // Add bridge test feature
      if (includeBridge && i > 0) {
        triangles.push(...this.generateBridgeFeature(section.height, i));
      }
      
      // Add overhang test feature
      if (includeOverhang) {
        triangles.push(...this.generateOverhangFeature(section.height, i));
      }
    }
    
    return {
      name: 'TemperatureTower',
      triangles
    };
  }

  private generateMainBody(totalHeight: number): Triangle[] {
    const { towerWidth, towerDepth } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Main rectangular tower body
    const halfWidth = towerWidth! / 2;
    const halfDepth = towerDepth! / 2;
    
    // Create the main tower as a box with some detail
    triangles.push(...this.createBoxTriangles(
      -halfWidth, halfWidth,
      -halfDepth, halfDepth,
      0, totalHeight
    ));
    
    // Add corner pillars for structural support
    const pillarRadius = 2;
    const pillarPositions = [
      { x: halfWidth - pillarRadius - 1, y: halfDepth - pillarRadius - 1, z: 0 },
      { x: -(halfWidth - pillarRadius - 1), y: halfDepth - pillarRadius - 1, z: 0 },
      { x: halfWidth - pillarRadius - 1, y: -(halfDepth - pillarRadius - 1), z: 0 },
      { x: -(halfWidth - pillarRadius - 1), y: -(halfDepth - pillarRadius - 1), z: 0 }
    ];
    
    for (const pos of pillarPositions) {
      triangles.push(...createCylinderMesh(pillarRadius, totalHeight, pos));
    }
    
    return triangles;
  }

  private generateSectionLabel(section: { height: number; value: number; label: string }, _index: number): Triangle[] {
    const { towerDepth, sectionHeight } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Create a recessed area for the label
    const labelWidth = 20;
    const labelHeight = 6;
    const labelDepth = 0.5;
    
    const labelX = 0; // Center
    const labelY = towerDepth! / 2 - 0.1; // Front face
    const labelZ = section.height + (sectionHeight! / 2);
    
    // Create recessed box for label background
    triangles.push(...this.createBoxTriangles(
      labelX - labelWidth/2, labelX + labelWidth/2,
      labelY - labelDepth, labelY,
      labelZ - labelHeight/2, labelZ + labelHeight/2
    ));
    
    // Add text (placeholder - would need proper text mesh generation)
    triangles.push(...generateTextMesh(
      section.label,
      { x: labelX, y: labelY, z: labelZ },
      4,
      0.3
    ));
    
    return triangles;
  }

  private generateBridgeFeature(sectionHeight: number, _index: number): Triangle[] {
    const { towerWidth, bridgeGap, sectionHeight: secHeight } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Create two pillars with a gap between them
    const pillarWidth = 5;
    const pillarDepth = 5;
    const bridgeHeight = 2;
    const bridgeZ = sectionHeight + (secHeight! * 0.7); // 70% up the section
    
    // Left pillar
    const leftX = -towerWidth! / 2 - pillarWidth - bridgeGap! / 2;
    triangles.push(...this.createBoxTriangles(
      leftX, leftX + pillarWidth,
      -pillarDepth / 2, pillarDepth / 2,
      sectionHeight, bridgeZ
    ));
    
    // Right pillar
    const rightX = -towerWidth! / 2 - pillarWidth + bridgeGap! / 2;
    triangles.push(...this.createBoxTriangles(
      rightX, rightX + pillarWidth,
      -pillarDepth / 2, pillarDepth / 2,
      sectionHeight, bridgeZ
    ));
    
    // Bridge connecting them
    triangles.push(...this.createBoxTriangles(
      leftX, rightX + pillarWidth,
      -pillarDepth / 2, pillarDepth / 2,
      bridgeZ, bridgeZ + bridgeHeight
    ));
    
    return triangles;
  }

  private generateOverhangFeature(sectionHeight: number, _index: number): Triangle[] {
    const { towerDepth, sectionHeight: secHeight } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Create progressive overhangs
    const overhangAngles = [30, 45, 60, 75]; // degrees
    const overhangWidth = 3;
    const overhangHeight = secHeight! * 0.8;
    const startZ = sectionHeight + secHeight! * 0.1;
    
    for (let i = 0; i < overhangAngles.length; i++) {
      const angle = overhangAngles[i];
      const radians = (angle * Math.PI) / 180;
      const overhangDepth = overhangHeight * Math.tan(radians);
      
      const x = -15 + (i * (overhangWidth + 2));
      const y = -towerDepth! / 2;
      
      // Create angled overhang
      const vertices: Vertex[] = [
        { x: x, y: y, z: startZ },
        { x: x + overhangWidth, y: y, z: startZ },
        { x: x + overhangWidth, y: y - overhangDepth, z: startZ + overhangHeight },
        { x: x, y: y - overhangDepth, z: startZ + overhangHeight }
      ];
      
      // Create triangles for the overhang face
      triangles.push(
        {
          normal: { x: 0, y: -Math.cos(radians), z: Math.sin(radians) },
          vertices: [vertices[0], vertices[1], vertices[2]]
        },
        {
          normal: { x: 0, y: -Math.cos(radians), z: Math.sin(radians) },
          vertices: [vertices[0], vertices[2], vertices[3]]
        }
      );
      
      // Add side faces
      triangles.push(
        {
          normal: { x: -1, y: 0, z: 0 },
          vertices: [vertices[0], vertices[3], { ...vertices[0], z: startZ + overhangHeight }]
        },
        {
          normal: { x: 1, y: 0, z: 0 },
          vertices: [vertices[1], { ...vertices[1], z: startZ + overhangHeight }, vertices[2]]
        }
      );
    }
    
    return triangles;
  }

  protected generateOrcaSettings(): OrcaSlicerSettings {
    const settings: OrcaSlicerSettings = {
      calibrationType: 'temperature_tower',
      parameters: {
        start_temperature: this.params.startValue,
        end_temperature: this.params.endValue,
        temperature_step: this.params.stepSize,
        tower_height: this.params.baseHeight! + (this.sections.length * this.params.sectionHeight!),
        material: this.params.material || 'PLA'
      },
      modifierSettings: []
    };

    // Generate modifier settings for each section
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      settings.modifierSettings.push({
        sectionIndex: i,
        settings: {
          'nozzle_temperature': section.value,
          'nozzle_temperature_initial_layer': i === 0 ? section.value : undefined
        }
      });
    }

    return settings;
  }

  protected generateInstructions(): string {
    const baseInstructions = super.generateInstructions();
    
    const additionalInstructions = `
Temperature Tower Specific Instructions:
=========================================

Material: ${this.params.material || 'Generic'}
Temperature Range: ${this.params.startValue}°C to ${this.params.endValue}°C
Step: ${this.params.stepSize}°C

Features to Evaluate:
1. Layer Adhesion - Look for delamination or poor bonding
2. Bridge Quality - Check bridging performance at each temperature
3. Overhang Quality - Evaluate overhang angles (30°, 45°, 60°, 75°)
4. Surface Finish - Look for stringing, blobs, or rough surfaces
5. Dimensional Accuracy - Check for warping or shrinkage

OrcaSlicer Setup:
1. Import the main tower STL
2. For each temperature section, add a modifier mesh
3. Set the nozzle temperature for each modifier:
${this.sections.map((s, i) => `   Section ${i + 1}: ${s.label}`).join('\n')}

Recommended Print Settings:
- Layer Height: 0.2mm
- Print Speed: 50-60mm/s
- No supports needed
- Cooling: Material default

Tips:
- Print multiple towers with different cooling settings
- Take photos of each section for comparison
- Test strength by trying to break bridges
- Check for stringing between features
`;

    return baseInstructions + additionalInstructions;
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