/**
 * OrcaSlicer Temperature Tower Generator
 * Generates temperature calibration towers with labeled sections
 */

import {
  TowerGeneratorBase,
  OrcaTowerParameters,
  OrcaSlicerSettings,
  MATERIAL_TEMP_PRESETS,
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
    
    // Main rectangular tower body - HOLLOW
    const halfWidth = towerWidth! / 2;
    const halfDepth = towerDepth! / 2;
    const wallThickness = 2; // 2mm walls
    
    // Create outer box
    triangles.push(...this.createBoxTriangles(
      -halfWidth, halfWidth,
      -halfDepth, halfDepth,
      0, totalHeight
    ));
    
    // Create inner cavity (hollow interior) - inverted normals
    const innerTriangles = this.createBoxTriangles(
      -halfWidth + wallThickness, halfWidth - wallThickness,
      -halfDepth + wallThickness, halfDepth - wallThickness,
      wallThickness, totalHeight  // Start from wallThickness to keep solid base
    );
    
    // Invert normals for inner cavity
    const invertedTriangles = innerTriangles.map(tri => ({
      normal: { x: -tri.normal.x, y: -tri.normal.y, z: -tri.normal.z },
      vertices: [tri.vertices[2], tri.vertices[1], tri.vertices[0]] as [Vertex, Vertex, Vertex]
    }));
    
    triangles.push(...invertedTriangles);
    
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
    const { bridgeGap, sectionHeight: secHeight } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Create two pillars with a gap between them - POSITIONED OUTSIDE MAIN TOWER
    const pillarWidth = 5;
    const pillarDepth = 5;
    const bridgeHeight = 2;
    const bridgeZ = sectionHeight + (secHeight! * 0.7); // 70% up the section
    
    // Position pillars on the FRONT of the tower (positive Y)
    const yPosition = 15; // Front face position
    
    // Left pillar
    const leftX = -bridgeGap! / 2 - pillarWidth;
    triangles.push(...this.createBoxTriangles(
      leftX, leftX + pillarWidth,
      yPosition, yPosition + pillarDepth,
      sectionHeight, bridgeZ
    ));
    
    // Right pillar  
    const rightX = bridgeGap! / 2;
    triangles.push(...this.createBoxTriangles(
      rightX, rightX + pillarWidth,
      yPosition, yPosition + pillarDepth,
      sectionHeight, bridgeZ
    ));
    
    // Bridge connecting them
    triangles.push(...this.createBoxTriangles(
      leftX, rightX + pillarWidth,
      yPosition, yPosition + pillarDepth,
      bridgeZ, bridgeZ + bridgeHeight
    ));
    
    return triangles;
  }

  private generateOverhangFeature(sectionHeight: number, _index: number): Triangle[] {
    const { towerDepth, sectionHeight: secHeight } = this.tempParams;
    const triangles: Triangle[] = [];
    
    // Create progressive overhangs extending FROM the BACK of the tower
    const overhangAngles = [30, 45, 60, 75]; // degrees  
    const overhangWidth = 5; // Wider for better visibility
    const overhangHeight = secHeight! * 0.6; // Height of each overhang section
    const startZ = sectionHeight + secHeight! * 0.2;
    
    // Position overhangs on the BACK of the tower (negative Y)
    const baseY = -towerDepth! / 2; // Back face of tower
    
    for (let i = 0; i < overhangAngles.length; i++) {
      const angle = overhangAngles[i];
      const radians = (angle * Math.PI) / 180;
      const overhangDepth = overhangHeight * Math.tan(radians);
      
      // Space them out along the back of the tower
      const x = -12 + (i * (overhangWidth + 3));
      
      // Create the overhang extending outward from the back
      // Bottom face (at startZ)
      triangles.push(
        {
          normal: { x: 0, y: 0, z: -1 },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: startZ }
          ]
        },
        {
          normal: { x: 0, y: 0, z: -1 },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: startZ },
            { x: x, y: baseY - overhangDepth, z: startZ }
          ]
        }
      );
      
      // Top face (at startZ + overhangHeight)
      const topZ = startZ + overhangHeight;
      triangles.push(
        {
          normal: { x: 0, y: 0, z: 1 },
          vertices: [
            { x: x, y: baseY, z: topZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ },
            { x: x + overhangWidth, y: baseY, z: topZ }
          ]
        },
        {
          normal: { x: 0, y: 0, z: 1 },
          vertices: [
            { x: x, y: baseY, z: topZ },
            { x: x, y: baseY - overhangDepth, z: topZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ }
          ]
        }
      );
      
      // Angled overhang face (the actual overhang test surface)
      triangles.push(
        {
          normal: { x: 0, y: -Math.cos(radians), z: -Math.sin(radians) },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x, y: baseY - overhangDepth, z: topZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ }
          ]
        },
        {
          normal: { x: 0, y: -Math.cos(radians), z: -Math.sin(radians) },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ },
            { x: x + overhangWidth, y: baseY, z: startZ }
          ]
        }
      );
      
      // Left side face
      triangles.push(
        {
          normal: { x: -1, y: 0, z: 0 },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x, y: baseY, z: topZ },
            { x: x, y: baseY - overhangDepth, z: topZ }
          ]
        },
        {
          normal: { x: -1, y: 0, z: 0 },
          vertices: [
            { x: x, y: baseY, z: startZ },
            { x: x, y: baseY - overhangDepth, z: topZ },
            { x: x, y: baseY - overhangDepth, z: startZ }
          ]
        }
      );
      
      // Right side face
      triangles.push(
        {
          normal: { x: 1, y: 0, z: 0 },
          vertices: [
            { x: x + overhangWidth, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ },
            { x: x + overhangWidth, y: baseY, z: topZ }
          ]
        },
        {
          normal: { x: 1, y: 0, z: 0 },
          vertices: [
            { x: x + overhangWidth, y: baseY, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ }
          ]
        }
      );
      
      // Back face (end of overhang)
      triangles.push(
        {
          normal: { x: 0, y: -1, z: 0 },
          vertices: [
            { x: x, y: baseY - overhangDepth, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ }
          ]
        },
        {
          normal: { x: 0, y: -1, z: 0 },
          vertices: [
            { x: x, y: baseY - overhangDepth, z: startZ },
            { x: x + overhangWidth, y: baseY - overhangDepth, z: topZ },
            { x: x, y: baseY - overhangDepth, z: topZ }
          ]
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