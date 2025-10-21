/**
 * OrcaSlicer PA Pattern 3MF Generator
 * Generates a 3×3 PA pattern grid with modifier meshes for each tile
 */

import JSZip from 'jszip';
import { create } from 'xmlbuilder2';
import { ParsedSTL } from './asciiStlUtils';
import { FirmwareType } from './postProcessingGenerator';

export interface PAPatternParameters {
  startPA: number;
  endPA: number;
  paStep: number;
  layerHeight: number;
  lineWidth: number;
  speeds: number[]; // [120, 150, 200]
  accelerations: number[]; // [4000, 6000, 10000]
  useOrcaNativeModifiers: boolean;
  firmware?: FirmwareType;
}

export interface PAPattern3MFResult {
  file: Blob;
  filename: string;
  instructions: string;
  tiles: {
    tileId: number;
    speed: number;
    accel: number;
    estimatedFlow: number;
    paStart: number;
    paEnd: number;
  }[];
}

/**
 * Generate a 3×3 PA pattern 3MF project with modifier meshes
 */
export async function generatePAPattern3MF(
  params: PAPatternParameters
): Promise<PAPattern3MFResult> {
  // Load the PA pattern template
  const patternSTL = await loadPAPatternTemplate();

  // Calculate tile configurations
  const tiles = generateTileConfigurations(params);

  // Generate 3MF content based on mode
  const { file, filename } = params.useOrcaNativeModifiers
    ? await generateOrcaNative3MF(patternSTL, tiles, params)
    : await generateFirmwareGcode3MF(patternSTL, tiles, params);

  const instructions = generateInstructions(params, tiles);

  return {
    file,
    filename,
    instructions,
    tiles
  };
}

/**
 * Load the PA pattern template STL
 */
async function loadPAPatternTemplate(): Promise<ParsedSTL> {
  const response = await fetch('/templates/pa_pattern_ascii.stl');
  if (!response.ok) {
    throw new Error(`Failed to load PA pattern template: ${response.statusText}`);
  }

  const templateContent = await response.text();
  console.log(`[PA Pattern] Loaded template: ${templateContent.length} bytes`);

  // Parse ASCII STL
  const lines = templateContent.split('\n');
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

  console.log(`[PA Pattern] Parsed ${triangles.length} triangles from template`);

  return {
    name: 'PAPattern3x3',
    triangles
  };
}

/**
 * Generate tile configurations for 3×3 grid
 */
function generateTileConfigurations(params: PAPatternParameters) {
  const tiles = [];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const tileId = row * 3 + col + 1;
      const speed = params.speeds[col];
      const accel = params.accelerations[row];
      const estimatedFlow = (speed * params.layerHeight * params.lineWidth) / 60;

      tiles.push({
        tileId,
        speed,
        accel,
        estimatedFlow,
        paStart: params.startPA,
        paEnd: params.endPA
      });
    }
  }

  return tiles;
}

/**
 * Create 3×3 grid of PA pattern by duplicating and offsetting the template geometry
 */
function create3x3PatternGrid(templateSTL: ParsedSTL): ParsedSTL {
  const allTriangles: any[] = [];

  // Chevron pattern spacing (based on OrcaSlicer's pa_pattern.3mf G-code analysis)
  // The single chevron is ~20mm wide, and we need ~25mm spacing between tiles
  const tileSpacingX = 25; // mm between tile centers in X
  const tileSpacingY = 25; // mm between tile centers in Y

  // Create 3×3 grid (9 tiles total)
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      // Calculate offset for this tile
      // Center the grid around origin
      const offsetX = (col - 1) * tileSpacingX;
      const offsetY = (row - 1) * tileSpacingY;

      // Duplicate all triangles from template with offset
      templateSTL.triangles.forEach(triangle => {
        const offsetTriangle = {
          vertices: triangle.vertices.map((v: any) => ({
            x: v.x + offsetX,
            y: v.y + offsetY,
            z: v.z
          })),
          normal: triangle.normal
        };
        allTriangles.push(offsetTriangle);
      });
    }
  }

  console.log(`[PA Pattern] Created 3×3 grid: ${allTriangles.length} total triangles (${templateSTL.triangles.length} × 9 tiles)`);

  return {
    name: 'PAPattern3x3Grid',
    triangles: allTriangles
  };
}

/**
 * Generate 3MF with Orca native modifiers using proper ZIP structure
 */
async function generateOrcaNative3MF(
  templateSTL: ParsedSTL,
  _tiles: any[], // Reserved for future tile-specific modifiers
  params: PAPatternParameters
) {
  const zip = new JSZip();

  // Create 3×3 grid from single chevron template
  const patternSTL = create3x3PatternGrid(templateSTL);

  // 1. Add [Content_Types].xml
  const contentTypes = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Types', { xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types' })
      .ele('Default', { Extension: 'rels', ContentType: 'application/vnd.openxmlformats-package.relationships+xml' }).up()
      .ele('Default', { Extension: 'model', ContentType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' }).up()
    .end({ prettyPrint: true });

  zip.file('[Content_Types].xml', contentTypes);

  // 2. Add _rels/.rels
  const rels = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' })
      .ele('Relationship', {
        Type: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel',
        Target: '/3D/3dmodel.model',
        Id: 'rel0'
      }).up()
    .end({ prettyPrint: true });

  zip.folder('_rels')?.file('.rels', rels);

  // 3. Create 3D model with pattern geometry
  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  const model = doc.ele('model', {
    unit: 'millimeter',
    xmlns: 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02',
    'xmlns:slic3rpe': 'http://schemas.slic3r.org/3mf/2017/06'
  });

  model.ele('metadata', { name: 'Application' }).txt('OrcaSlicer Calibration Tool');
  model.ele('metadata', { name: 'Title' }).txt('PA Pattern 3x3 Grid');

  const resources = model.ele('resources');

  // Add main object with mesh data
  const object = resources.ele('object', { id: '1', type: 'model' });
  const mesh = object.ele('mesh');
  const vertices = mesh.ele('vertices');
  const triangles = mesh.ele('triangles');

  // Add vertices and triangles from STL
  const vertexMap = new Map<string, number>();
  let vertexIndex = 0;

  patternSTL.triangles.forEach(triangle => {
    const triIndices: number[] = [];

    triangle.vertices.forEach(vertex => {
      const key = `${vertex.x},${vertex.y},${vertex.z}`;
      if (!vertexMap.has(key)) {
        vertices.ele('vertex', {
          x: vertex.x.toFixed(6),
          y: vertex.y.toFixed(6),
          z: vertex.z.toFixed(6)
        });
        vertexMap.set(key, vertexIndex);
        triIndices.push(vertexIndex);
        vertexIndex++;
      } else {
        triIndices.push(vertexMap.get(key)!);
      }
    });

    triangles.ele('triangle', {
      v1: triIndices[0],
      v2: triIndices[1],
      v3: triIndices[2]
    });
  });

  // Add build section
  const build = model.ele('build');
  build.ele('item', { objectid: '1' });

  const modelXml = doc.end({ prettyPrint: true });
  zip.folder('3D')?.file('3dmodel.model', modelXml);

  // 4. Generate blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return {
    file: blob,
    filename: `PA_Pattern_3x3_${params.startPA.toFixed(3)}-${params.endPA.toFixed(3)}.3mf`
  };
}

/**
 * Generate 3MF with firmware G-code post-processing using proper ZIP structure
 */
async function generateFirmwareGcode3MF(
  templateSTL: ParsedSTL,
  _tiles: any[], // Reserved for future metadata enhancement
  params: PAPatternParameters
) {
  const zip = new JSZip();
  const firmware = params.firmware || 'marlin';

  // Create 3×3 grid from single chevron template
  const patternSTL = create3x3PatternGrid(templateSTL);

  // Use the same structure as Orca native, but we'll add G-code metadata

  // 1. Add [Content_Types].xml
  const contentTypes = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Types', { xmlns: 'http://schemas.openxmlformats.org/package/2006/content-types' })
      .ele('Default', { Extension: 'rels', ContentType: 'application/vnd.openxmlformats-package.relationships+xml' }).up()
      .ele('Default', { Extension: 'model', ContentType: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' }).up()
    .end({ prettyPrint: true });

  zip.file('[Content_Types].xml', contentTypes);

  // 2. Add _rels/.rels
  const rels = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Relationships', { xmlns: 'http://schemas.openxmlformats.org/package/2006/relationships' })
      .ele('Relationship', {
        Type: 'http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel',
        Target: '/3D/3dmodel.model',
        Id: 'rel0'
      }).up()
    .end({ prettyPrint: true });

  zip.folder('_rels')?.file('.rels', rels);

  // 3. Create 3D model with pattern geometry
  const doc = create({ version: '1.0', encoding: 'UTF-8' });
  const model = doc.ele('model', {
    unit: 'millimeter',
    xmlns: 'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'
  });

  model.ele('metadata', { name: 'Application' }).txt('OrcaSlicer Calibration Tool');
  model.ele('metadata', { name: 'Title' }).txt(`PA Pattern 3x3 - ${firmware.toUpperCase()}`);
  model.ele('metadata', { name: 'Description' }).txt(generatePAGcodeCommands(params, firmware));

  const resources = model.ele('resources');

  // Add main object with mesh data
  const object = resources.ele('object', { id: '1', type: 'model' });
  const mesh = object.ele('mesh');
  const vertices = mesh.ele('vertices');
  const triangles = mesh.ele('triangles');

  // Add vertices and triangles from STL
  const vertexMap = new Map<string, number>();
  let vertexIndex = 0;

  patternSTL.triangles.forEach(triangle => {
    const triIndices: number[] = [];

    triangle.vertices.forEach(vertex => {
      const key = `${vertex.x},${vertex.y},${vertex.z}`;
      if (!vertexMap.has(key)) {
        vertices.ele('vertex', {
          x: vertex.x.toFixed(6),
          y: vertex.y.toFixed(6),
          z: vertex.z.toFixed(6)
        });
        vertexMap.set(key, vertexIndex);
        triIndices.push(vertexIndex);
        vertexIndex++;
      } else {
        triIndices.push(vertexMap.get(key)!);
      }
    });

    triangles.ele('triangle', {
      v1: triIndices[0],
      v2: triIndices[1],
      v3: triIndices[2]
    });
  });

  // Add build section
  const build = model.ele('build');
  build.ele('item', { objectid: '1' });

  const modelXml = doc.end({ prettyPrint: true });
  zip.folder('3D')?.file('3dmodel.model', modelXml);

  // 4. Generate blob
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  return {
    file: blob,
    filename: `PA_Pattern_3x3_${firmware.toUpperCase()}_${params.startPA.toFixed(3)}-${params.endPA.toFixed(3)}.3mf`
  };
}

/**
 * Generate firmware-specific G-code commands for PA changes
 */
function generatePAGcodeCommands(params: PAPatternParameters, firmware: FirmwareType): string {
  let commands = '; PA Pattern Calibration G-code\n';
  commands += `; Range: ${params.startPA.toFixed(3)} to ${params.endPA.toFixed(3)}\n`;
  commands += `; Step: ${params.paStep.toFixed(3)}\n\n`;

  const numChevrons = Math.floor((params.endPA - params.startPA) / params.paStep) + 1;

  for (let i = 0; i < numChevrons; i++) {
    const paValue = params.startPA + (i * params.paStep);

    switch (firmware) {
      case 'klipper':
        commands += `; Chevron ${i + 1}: PA ${paValue.toFixed(3)}\n`;
        commands += `SET_PRESSURE_ADVANCE ADVANCE=${paValue.toFixed(3)}\n\n`;
        break;
      case 'marlin':
        commands += `; Chevron ${i + 1}: PA ${paValue.toFixed(3)}\n`;
        commands += `M900 K${paValue.toFixed(3)}\n\n`;
        break;
      case 'rrf':
        commands += `; Chevron ${i + 1}: PA ${paValue.toFixed(3)}\n`;
        commands += `M572 D0 S${paValue.toFixed(3)}\n\n`;
        break;
      default:
        commands += `; Chevron ${i + 1}: PA ${paValue.toFixed(3)}\n\n`;
    }
  }

  return commands;
}

/**
 * Generate instructions for the PA pattern test
 */
function generateInstructions(params: PAPatternParameters, tiles: Array<{
  tileId: number;
  speed: number;
  accel: number;
  estimatedFlow: number;
  paStart: number;
  paEnd: number;
}>): string {
  const mode = params.useOrcaNativeModifiers ? 'Orca Native Modifiers' : `Firmware G-code (${params.firmware || 'marlin'})`;

  return `## PA Pattern 3×3 Grid - Setup Instructions

### Test Configuration
- **Mode**: ${mode}
- **PA Range**: ${params.startPA.toFixed(3)} to ${params.endPA.toFixed(3)}
- **PA Step**: ${params.paStep.toFixed(3)}
- **Layer Height**: ${params.layerHeight}mm
- **Line Width**: ${params.lineWidth}mm

### Grid Layout
${tiles.map(tile =>
  `Tile ${tile.tileId}: ${tile.speed}mm/s @ ${tile.accel}mm/s² (Est. flow: ${tile.estimatedFlow.toFixed(2)}mm³/s)`
).join('\n')}

### OrcaSlicer Setup

1. **Import the 3MF Project**:
   - File → Import → Import 3MF/STL
   - The pattern should load with ${params.useOrcaNativeModifiers ? 'modifier meshes embedded' : 'G-code ready for slicing'}

2. **Verify Settings**:
   - Layer Height: ${params.layerHeight}mm
   - Line Width: ${params.lineWidth}mm (match your nozzle)
   - Perimeters: 2
   - Top/Bottom Layers: 0
   - Infill: 0%

${params.useOrcaNativeModifiers ? `
3. **Check Modifier Meshes**:
   - Each tile should have speed and acceleration modifiers
   - PA values will vary by chevron within each tile
   - Preview should show different colors for different tiles
` : `
3. **Review G-code**:
   - Check that PA commands are present
   - Verify firmware compatibility (${params.firmware || 'marlin'})
   - Commands will change PA at specific points in the pattern
`}

### How to Evaluate

1. **Print the Pattern**:
   - Watch for consistent extrusion
   - Note any stringing or gaps

2. **Identify Best Chevron** for each tile:
   - **Too Low PA**: Bulging corners, excess material after corners
   - **Optimal PA**: Sharp 90° corners, consistent line width
   - **Too High PA**: Gaps at corners, under-extrusion after direction changes

3. **Record Results**:
   - Note the best chevron number for each tile
   - Measure actual flow if possible
   - Enter values in the PA Optimizer Analysis tab

### Expected Results
- Each tile tests the same PA range at different speeds/accelerations
- Optimal PA typically decreases with higher flow rates
- Higher acceleration usually requires lower PA values
- Results will be used to generate adaptive PA table

### Next Steps
1. Print this pattern
2. Identify best chevron for each tile
3. Return to PA Optimizer → Input tab
4. Enter your results
5. Proceed to Analysis for optimal PA recommendations
`;
}
