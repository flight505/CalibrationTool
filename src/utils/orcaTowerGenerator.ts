/**
 * OrcaSlicer Tower Generator
 * Generates parametric calibration towers optimized for OrcaSlicer
 */

import { stlToString, ParsedSTL, Triangle } from './asciiStlUtils';
import { SliceSettings, STLGeometryInfo } from './stlGeometryAnalyzer';

export interface OrcaTowerParameters {
  type: 'temperature' | 'pressure_advance' | 'max_flow' | 'fan' | 'layer_time' | 'retraction' | 'fan_speed' | 'flow_rate' | 'max_volumetric';
  startValue: number;
  endValue: number;
  stepSize: number;
  baseHeight?: number;
  sectionHeight?: number;
  towerWidth?: number;
  towerDepth?: number;
  includeLabels?: boolean;
  includeModifierMesh?: boolean;
  material?: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'PC' | 'PA';
  // Slice settings for accurate Z-height calculation
  sliceSettings?: SliceSettings;
}

export interface TowerSection {
  height: number;
  value: number;
  label: string;
  modifierMesh?: ParsedSTL;
}

export interface GeneratedTower {
  mainSTL: Blob;
  sections: TowerSection[];
  modifierMeshes?: Blob[];
  orcaSettings?: OrcaSlicerSettings;
  instructions: string;
  geometryInfo?: STLGeometryInfo;  // Actual STL geometry analysis
  sliceSettings?: SliceSettings;    // User's slice settings
}

export interface OrcaSlicerSettings {
  calibrationType: string;
  parameters: Record<string, any>;
  modifierSettings: Array<{
    sectionIndex: number;
    settings: Record<string, any>;
  }>;
}

/**
 * Material temperature presets for different filament types
 */
export const MATERIAL_TEMP_PRESETS = {
  PLA: { start: 220, end: 190, step: 5, hotend: 'standard' },
  PETG: { start: 250, end: 220, step: 5, hotend: 'standard' },
  ABS: { start: 260, end: 230, step: 5, hotend: 'standard' },
  TPU: { start: 240, end: 210, step: 5, hotend: 'standard' },
  ASA: { start: 270, end: 240, step: 5, hotend: 'high-temp' },
  PC: { start: 290, end: 260, step: 5, hotend: 'high-temp' },
  PA: { start: 280, end: 250, step: 5, hotend: 'high-temp' }
};

/**
 * Pressure Advance presets for different extruder types
 */
export const PA_PRESETS = {
  direct_drive: { start: 0.00, end: 0.10, step: 0.01 },
  bowden: { start: 0.00, end: 0.50, step: 0.05 },
  high_speed: { start: 0.00, end: 0.05, step: 0.005 }
};

/**
 * Base class for tower generation
 */
export abstract class TowerGeneratorBase {
  protected params: OrcaTowerParameters;
  protected sections: TowerSection[] = [];
  protected geometryInfo?: STLGeometryInfo;

  constructor(params: OrcaTowerParameters) {
    // Default slice settings
    const defaultSliceSettings = {
      layerHeight: 0.2,
      firstLayerHeight: 0.3,
      nozzleDiameter: 0.4
    };

    this.params = {
      baseHeight: 1.0,
      sectionHeight: 10.0,
      towerWidth: 40,
      towerDepth: 10,
      includeLabels: true,
      includeModifierMesh: true,
      ...params,
      // Merge slice settings if provided
      sliceSettings: {
        ...defaultSliceSettings,
        ...(params.sliceSettings || {})
      }
    };

    this.calculateSections();
  }

  /**
   * Calculate the number and values of tower sections
   */
  protected calculateSections(): void {
    const { startValue, endValue, stepSize, baseHeight, sectionHeight } = this.params;

    if (stepSize === 0) {
      throw new Error('Section calculation failed: stepSize must be non-zero');
    }
    
    const direction = endValue > startValue ? 1 : -1;
    const totalSpan = Math.abs(endValue - startValue);
    const rawSteps = totalSpan / Math.abs(stepSize);
    const steps = Math.floor(rawSteps + 1e-6) + 1;
    
    let currentHeight = baseHeight!;
    
    for (let i = 0; i < steps; i++) {
      let value = startValue + (i * stepSize * direction);
      if (i === steps - 1) {
        value = endValue;
      }
      this.sections.push({
        height: currentHeight,
        value: value,
        label: this.formatLabel(value)
      });
      currentHeight += sectionHeight!;
    }
  }

  /**
   * Format the label for a section based on tower type
   */
  protected abstract formatLabel(value: number): string;

  /**
   * Generate the main tower geometry
   */
  protected abstract generateTowerGeometry(): ParsedSTL | Promise<ParsedSTL>;

  /**
   * Generate modifier meshes for each section
   */
  protected generateModifierMeshes(): ParsedSTL[] {
    const modifiers: ParsedSTL[] = [];
    const { towerWidth, towerDepth, sectionHeight } = this.params;
    
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const triangles: Triangle[] = [];
      
      // Create a simple box for each section as modifier
      const minX = -towerWidth! / 2;
      const maxX = towerWidth! / 2;
      const minY = -towerDepth! / 2;
      const maxY = towerDepth! / 2;
      const minZ = section.height;
      const maxZ = section.height + sectionHeight!;
      
      // Generate box faces
      triangles.push(...this.createBoxTriangles(minX, maxX, minY, maxY, minZ, maxZ));
      
      modifiers.push({
        name: `modifier_section_${i}`,
        triangles
      });
    }
    
    return modifiers;
  }

  /**
   * Helper to create box triangles
   */
  protected createBoxTriangles(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    
    // Define vertices
    const v = [
      { x: minX, y: minY, z: minZ }, // 0
      { x: maxX, y: minY, z: minZ }, // 1
      { x: maxX, y: maxY, z: minZ }, // 2
      { x: minX, y: maxY, z: minZ }, // 3
      { x: minX, y: minY, z: maxZ }, // 4
      { x: maxX, y: minY, z: maxZ }, // 5
      { x: maxX, y: maxY, z: maxZ }, // 6
      { x: minX, y: maxY, z: maxZ }  // 7
    ];
    
    // Bottom face
    triangles.push(
      { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[1], v[2]] },
      { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[2], v[3]] }
    );
    
    // Top face
    triangles.push(
      { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[6], v[5]] },
      { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[7], v[6]] }
    );
    
    // Front face
    triangles.push(
      { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[4], v[5]] },
      { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[5], v[1]] }
    );
    
    // Back face
    triangles.push(
      { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[6], v[7]] },
      { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[7], v[3]] }
    );
    
    // Left face
    triangles.push(
      { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[3], v[7]] },
      { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[7], v[4]] }
    );
    
    // Right face
    triangles.push(
      { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[5], v[6]] },
      { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[6], v[2]] }
    );
    
    return triangles;
  }

  /**
   * Generate OrcaSlicer-specific settings for the tower
   */
  protected abstract generateOrcaSettings(): OrcaSlicerSettings;

  /**
   * Get modifier settings for a specific tower section
   * Each tower type implements this to return appropriate OrcaSlicer settings
   *
   * @param section - The tower section to generate settings for
   * @returns Record of OrcaSlicer setting keys and values
   */
  protected abstract getModifierSettings(section: TowerSection): Record<string, string | number>;

  /**
   * Generate usage instructions
   */
  protected generateInstructions(): string {
    return `OrcaSlicer Calibration Tower Instructions:
    
1. Import the main STL file into OrcaSlicer
2. If modifier meshes are included, import them as modifier meshes
3. Apply the provided settings to each modifier region
4. Slice and print the tower
5. Evaluate the results and choose the best value

Tower Parameters:
- Type: ${this.params.type}
- Start Value: ${this.params.startValue}
- End Value: ${this.params.endValue}
- Step Size: ${this.params.stepSize}
- Total Sections: ${this.sections.length}
`;
  }

  /**
   * Generate the complete tower with all components
   */
  public async generate(): Promise<GeneratedTower> {
    const mainGeometry = await this.generateTowerGeometry();

    // Analyze the geometry to understand actual section positions
    const { analyzeSTLGeometry } = await import('./stlGeometryAnalyzer');
    this.geometryInfo = analyzeSTLGeometry(mainGeometry);

    // Validate the main geometry
    this.validateGeometry(mainGeometry);

    const mainSTL = new Blob([stlToString(mainGeometry)], { type: 'application/sla' });

    const result: GeneratedTower = {
      mainSTL,
      sections: this.sections,
      instructions: this.generateInstructions(),
      geometryInfo: this.geometryInfo,
      sliceSettings: this.params.sliceSettings
    };

    if (this.params.includeModifierMesh) {
      const modifiers = this.generateModifierMeshes();

      // Validate each modifier mesh
      modifiers.forEach((mod, index) => {
        try {
          this.validateGeometry(mod);
        } catch (error) {
          console.warn(`Warning: Modifier mesh ${index} validation failed:`, error);
        }
      });

      result.modifierMeshes = modifiers.map(mod =>
        new Blob([stlToString(mod)], { type: 'application/sla' })
      );
      result.orcaSettings = this.generateOrcaSettings();
    }

    return result;
  }
  
  /**
   * Validate geometry for common issues
   */
  protected validateGeometry(geometry: ParsedSTL): void {
    if (!geometry.triangles || geometry.triangles.length === 0) {
      throw new Error('Geometry validation failed: No triangles generated');
    }
    
    // Check for degenerate triangles and calculate bounds
    let degenerateCount = 0;
    let invalidNormalCount = 0;
    const boundsMin = { x: Infinity, y: Infinity, z: Infinity };
    const boundsMax = { x: -Infinity, y: -Infinity, z: -Infinity };
    
    for (const triangle of geometry.triangles) {
      // Check vertices
      if (!triangle.vertices || triangle.vertices.length !== 3) {
        throw new Error('Geometry validation failed: Invalid triangle structure');
      }
      
      // Update bounds
      for (const vertex of triangle.vertices) {
        boundsMin.x = Math.min(boundsMin.x, vertex.x);
        boundsMin.y = Math.min(boundsMin.y, vertex.y);
        boundsMin.z = Math.min(boundsMin.z, vertex.z);
        boundsMax.x = Math.max(boundsMax.x, vertex.x);
        boundsMax.y = Math.max(boundsMax.y, vertex.y);
        boundsMax.z = Math.max(boundsMax.z, vertex.z);
      }
      
      // Check for degenerate triangles (zero area)
      const v0 = triangle.vertices[0];
      const v1 = triangle.vertices[1];
      const v2 = triangle.vertices[2];
      
      const edge1 = {
        x: v1.x - v0.x,
        y: v1.y - v0.y,
        z: v1.z - v0.z
      };
      const edge2 = {
        x: v2.x - v0.x,
        y: v2.y - v0.y,
        z: v2.z - v0.z
      };
      
      // Cross product to check area
      const cross = {
        x: edge1.y * edge2.z - edge1.z * edge2.y,
        y: edge1.z * edge2.x - edge1.x * edge2.z,
        z: edge1.x * edge2.y - edge1.y * edge2.x
      };
      
      const area = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
      if (area < 0.0001) {
        degenerateCount++;
      }
      
      // Check normal validity
      const normal = triangle.normal;
      const normalLength = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
      if (normalLength < 0.0001 || normalLength > 1.1) {
        invalidNormalCount++;
      }
    }
    
    // Calculate dimensions
    const dimensions = {
      width: boundsMax.x - boundsMin.x,
      depth: boundsMax.y - boundsMin.y,
      height: boundsMax.z - boundsMin.z
    };
    
    // Validation checks
    if (degenerateCount > geometry.triangles.length * 0.01) {
      console.warn(`Warning: ${degenerateCount} degenerate triangles found (${(degenerateCount / geometry.triangles.length * 100).toFixed(1)}%)`);
    }
    
    if (invalidNormalCount > 0) {
      console.warn(`Warning: ${invalidNormalCount} triangles with invalid normals`);
    }
    
    // Check reasonable bounds
    if (dimensions.width <= 0 || dimensions.depth <= 0 || dimensions.height <= 0) {
      throw new Error(`Geometry validation failed: Invalid dimensions (${dimensions.width.toFixed(2)} x ${dimensions.depth.toFixed(2)} x ${dimensions.height.toFixed(2)})`);
    }
    
    if (dimensions.width > 200 || dimensions.depth > 200 || dimensions.height > 300) {
      console.warn(`Warning: Large model dimensions (${dimensions.width.toFixed(2)} x ${dimensions.depth.toFixed(2)} x ${dimensions.height.toFixed(2)}) mm`);
    }
    
    if (boundsMin.z < -0.01) {
      console.warn(`Warning: Model extends below Z=0 (min Z: ${boundsMin.z.toFixed(2)})`);
    }
    
    console.log(`Geometry validated: ${geometry.triangles.length} triangles, dimensions: ${dimensions.width.toFixed(2)} x ${dimensions.depth.toFixed(2)} x ${dimensions.height.toFixed(2)} mm`);
  }
}

/**
 * Generate a text label as triangles (simplified version)
 * In a real implementation, this would use a proper text-to-mesh library
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function generateTextMesh(..._args: unknown[]): Triangle[] {
  // This is a placeholder - in production, use a proper text mesh generator
  // For now, return an empty array
  return [];
}

/**
 * Utility to create a cylinder mesh
 */
export function createCylinderMesh(
  radius: number,
  height: number,
  position: { x: number, y: number, z: number },
  segments: number = 32
): Triangle[] {
  const triangles: Triangle[] = [];
  const angleStep = (2 * Math.PI) / segments;
  
  // Generate vertices
  const bottomCenter = position;
  const topCenter = { ...position, z: position.z + height };
  
  for (let i = 0; i < segments; i++) {
    const angle1 = i * angleStep;
    const angle2 = (i + 1) * angleStep;
    
    const x1 = position.x + radius * Math.cos(angle1);
    const y1 = position.y + radius * Math.sin(angle1);
    const x2 = position.x + radius * Math.cos(angle2);
    const y2 = position.y + radius * Math.sin(angle2);
    
    const bottomV1 = { x: x1, y: y1, z: position.z };
    const bottomV2 = { x: x2, y: y2, z: position.z };
    const topV1 = { x: x1, y: y1, z: position.z + height };
    const topV2 = { x: x2, y: y2, z: position.z + height };
    
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
