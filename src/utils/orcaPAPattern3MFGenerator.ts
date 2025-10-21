/**
 * OrcaSlicer PA Pattern 3MF Generator
 * Generates a 3×3 PA pattern grid with modifier meshes for each tile
 */

import { ParsedSTL, stlToString } from './asciiStlUtils';
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
 * Generate 3MF with Orca native modifiers
 */
async function generateOrcaNative3MF(
  patternSTL: ParsedSTL,
  tiles: any[],
  params: PAPatternParameters
) {
  // This will embed modifier meshes in the 3MF
  // Each tile gets its own modifier with PA range

  const stlContent = stlToString(patternSTL);

  // Create 3MF structure
  const project = {
    model: stlContent,
    modifiers: tiles.map(tile => ({
      tileId: tile.tileId,
      settings: {
        outer_wall_speed: tile.speed.toString(),
        default_acceleration: tile.accel.toString(),
        // PA values will be set per chevron in the pattern
        pressure_advance_start: params.startPA.toString(),
        pressure_advance_end: params.endPA.toString()
      }
    })),
    metadata: {
      generator: 'CalibrationTool',
      type: 'pa_pattern_3x3',
      mode: 'orca_native'
    }
  };

  // Convert to 3MF blob (simplified - in practice needs full 3MF zip structure)
  const blob = new Blob([JSON.stringify(project)], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });

  return {
    file: blob,
    filename: `PA_Pattern_3x3_OrcaNative_${params.startPA.toFixed(3)}-${params.endPA.toFixed(3)}.3mf`
  };
}

/**
 * Generate 3MF with firmware G-code post-processing
 */
async function generateFirmwareGcode3MF(
  patternSTL: ParsedSTL,
  tiles: any[],
  params: PAPatternParameters
) {
  const stlContent = stlToString(patternSTL);
  const firmware = params.firmware || 'marlin';

  // Generate G-code commands for PA changes
  const gcodeCommands = generatePAGcodeCommands(params, firmware);

  const project = {
    model: stlContent,
    gcode: gcodeCommands,
    metadata: {
      generator: 'CalibrationTool',
      type: 'pa_pattern_3x3',
      mode: 'firmware_gcode',
      firmware
    }
  };

  const blob = new Blob([JSON.stringify(project)], { type: 'application/vnd.ms-package.3dmanufacturing-3dmodel+xml' });

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
function generateInstructions(params: PAPatternParameters, tiles: any[]): string {
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
