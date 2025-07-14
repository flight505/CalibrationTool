import * as THREE from 'three';

interface CubeParameters {
  nozzleSize: number;
  cubeSize?: number;
  baseHeight?: number;
  singleWallHeight?: number;
  doubleWallHeight?: number;
}

export function generateFlowCalibrationCube({
  nozzleSize,
  cubeSize = 20,
  baseHeight = 0.8,
  singleWallHeight = 8,
  doubleWallHeight = 10
}: CubeParameters): Blob {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];

  // Wall thickness calculations
  const thickWallThickness = nozzleSize * 3; // 1.2mm for 0.4mm nozzle (single wall)
  const thinWallThickness = nozzleSize; // 0.4mm for 0.4mm nozzle (will be printed with 2 perimeters)

  // Helper function to add a vertex with normal
  const addVertex = (x: number, y: number, z: number, nx: number, ny: number, nz: number) => {
    vertices.push(x, y, z);
    normals.push(nx, ny, nz);
  };

  // Helper function to add a triangle
  const addTriangle = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    normal: [number, number, number]
  ) => {
    addVertex(...v1, ...normal);
    addVertex(...v2, ...normal);
    addVertex(...v3, ...normal);
  };

  // Helper function to add a quad (two triangles)
  const addQuad = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
    v4: [number, number, number],
    normal: [number, number, number]
  ) => {
    addTriangle(v1, v2, v3, normal);
    addTriangle(v1, v3, v4, normal);
  };

  // Dimensions
  const halfSize = cubeSize / 2; // 10mm
  const totalHeight = baseHeight + singleWallHeight + doubleWallHeight; // 18.8mm
  
  // Heights for different sections
  const z0 = 0; // Bottom
  const z1 = baseHeight; // Top of base (0.8mm)
  const z2 = baseHeight + singleWallHeight; // Top of single wall section (8.8mm)
  const z3 = totalHeight; // Top of cube (18.8mm)
  
  // Inner dimensions
  const thickInnerHalf = halfSize - thickWallThickness; // 10 - 1.2 = 8.8mm (17.6mm cavity)
  const thinInnerHalf = halfSize - thinWallThickness; // 10 - 0.4 = 9.6mm (19.2mm cavity)

  // 1. BOTTOM FACE (solid base)
  addQuad(
    [-halfSize, -halfSize, z0],
    [-halfSize, halfSize, z0],
    [halfSize, halfSize, z0],
    [halfSize, -halfSize, z0],
    [0, 0, -1]
  );

  // 2. OUTER WALLS (continuous from bottom to top)
  // Front wall
  addQuad(
    [-halfSize, -halfSize, z0],
    [halfSize, -halfSize, z0],
    [halfSize, -halfSize, z3],
    [-halfSize, -halfSize, z3],
    [0, -1, 0]
  );
  
  // Back wall
  addQuad(
    [-halfSize, halfSize, z0],
    [-halfSize, halfSize, z3],
    [halfSize, halfSize, z3],
    [halfSize, halfSize, z0],
    [0, 1, 0]
  );
  
  // Left wall
  addQuad(
    [-halfSize, -halfSize, z0],
    [-halfSize, -halfSize, z3],
    [-halfSize, halfSize, z3],
    [-halfSize, halfSize, z0],
    [-1, 0, 0]
  );
  
  // Right wall
  addQuad(
    [halfSize, -halfSize, z0],
    [halfSize, halfSize, z0],
    [halfSize, halfSize, z3],
    [halfSize, -halfSize, z3],
    [1, 0, 0]
  );

  // 3. TOP OF BASE (z=0.8mm) - frame with hole for thick wall cavity
  // Front strip
  addQuad(
    [-halfSize, -halfSize, z1],
    [halfSize, -halfSize, z1],
    [thickInnerHalf, -thickInnerHalf, z1],
    [-thickInnerHalf, -thickInnerHalf, z1],
    [0, 0, 1]
  );
  
  // Back strip
  addQuad(
    [-halfSize, halfSize, z1],
    [-thickInnerHalf, thickInnerHalf, z1],
    [thickInnerHalf, thickInnerHalf, z1],
    [halfSize, halfSize, z1],
    [0, 0, 1]
  );
  
  // Left strip
  addQuad(
    [-halfSize, -halfSize, z1],
    [-thickInnerHalf, -thickInnerHalf, z1],
    [-thickInnerHalf, thickInnerHalf, z1],
    [-halfSize, halfSize, z1],
    [0, 0, 1]
  );
  
  // Right strip
  addQuad(
    [thickInnerHalf, -thickInnerHalf, z1],
    [halfSize, -halfSize, z1],
    [halfSize, halfSize, z1],
    [thickInnerHalf, thickInnerHalf, z1],
    [0, 0, 1]
  );

  // 4. THICK WALL SECTION - Inner walls (z1 to z2)
  // Front inner wall
  addQuad(
    [-thickInnerHalf, -thickInnerHalf, z1],
    [thickInnerHalf, -thickInnerHalf, z1],
    [thickInnerHalf, -thickInnerHalf, z2],
    [-thickInnerHalf, -thickInnerHalf, z2],
    [0, 1, 0]
  );
  
  // Back inner wall
  addQuad(
    [-thickInnerHalf, thickInnerHalf, z1],
    [-thickInnerHalf, thickInnerHalf, z2],
    [thickInnerHalf, thickInnerHalf, z2],
    [thickInnerHalf, thickInnerHalf, z1],
    [0, -1, 0]
  );
  
  // Left inner wall
  addQuad(
    [-thickInnerHalf, -thickInnerHalf, z1],
    [-thickInnerHalf, -thickInnerHalf, z2],
    [-thickInnerHalf, thickInnerHalf, z2],
    [-thickInnerHalf, thickInnerHalf, z1],
    [1, 0, 0]
  );
  
  // Right inner wall
  addQuad(
    [thickInnerHalf, -thickInnerHalf, z1],
    [thickInnerHalf, thickInnerHalf, z1],
    [thickInnerHalf, thickInnerHalf, z2],
    [thickInnerHalf, -thickInnerHalf, z2],
    [-1, 0, 0]
  );

  // 5. TRANSITION STEP (z=8.8mm) - connects thick wall cavity to thin wall cavity
  // This creates the step from 17.6mm cavity to 19.2mm cavity
  
  // Front step
  addQuad(
    [-thickInnerHalf, -thickInnerHalf, z2],
    [thickInnerHalf, -thickInnerHalf, z2],
    [thinInnerHalf, -thinInnerHalf, z2],
    [-thinInnerHalf, -thinInnerHalf, z2],
    [0, 0, 1]
  );
  
  // Back step
  addQuad(
    [-thickInnerHalf, thickInnerHalf, z2],
    [-thinInnerHalf, thinInnerHalf, z2],
    [thinInnerHalf, thinInnerHalf, z2],
    [thickInnerHalf, thickInnerHalf, z2],
    [0, 0, 1]
  );
  
  // Left step
  addQuad(
    [-thickInnerHalf, -thickInnerHalf, z2],
    [-thinInnerHalf, -thinInnerHalf, z2],
    [-thinInnerHalf, thinInnerHalf, z2],
    [-thickInnerHalf, thickInnerHalf, z2],
    [0, 0, 1]
  );
  
  // Right step
  addQuad(
    [thickInnerHalf, -thickInnerHalf, z2],
    [thickInnerHalf, thickInnerHalf, z2],
    [thinInnerHalf, thinInnerHalf, z2],
    [thinInnerHalf, -thinInnerHalf, z2],
    [0, 0, 1]
  );

  // 6. THIN WALL SECTION - Inner walls (z2 to z3)
  // Front inner wall
  addQuad(
    [-thinInnerHalf, -thinInnerHalf, z2],
    [thinInnerHalf, -thinInnerHalf, z2],
    [thinInnerHalf, -thinInnerHalf, z3],
    [-thinInnerHalf, -thinInnerHalf, z3],
    [0, 1, 0]
  );
  
  // Back inner wall
  addQuad(
    [-thinInnerHalf, thinInnerHalf, z2],
    [-thinInnerHalf, thinInnerHalf, z3],
    [thinInnerHalf, thinInnerHalf, z3],
    [thinInnerHalf, thinInnerHalf, z2],
    [0, -1, 0]
  );
  
  // Left inner wall
  addQuad(
    [-thinInnerHalf, -thinInnerHalf, z2],
    [-thinInnerHalf, -thinInnerHalf, z3],
    [-thinInnerHalf, thinInnerHalf, z3],
    [-thinInnerHalf, thinInnerHalf, z2],
    [1, 0, 0]
  );
  
  // Right inner wall
  addQuad(
    [thinInnerHalf, -thinInnerHalf, z2],
    [thinInnerHalf, thinInnerHalf, z2],
    [thinInnerHalf, thinInnerHalf, z3],
    [thinInnerHalf, -thinInnerHalf, z3],
    [-1, 0, 0]
  );

  // 7. TOP FACE (z3) - frame with hole for thin wall cavity
  // Front strip
  addQuad(
    [-halfSize, -halfSize, z3],
    [halfSize, -halfSize, z3],
    [thinInnerHalf, -thinInnerHalf, z3],
    [-thinInnerHalf, -thinInnerHalf, z3],
    [0, 0, 1]
  );
  
  // Back strip
  addQuad(
    [-halfSize, halfSize, z3],
    [-thinInnerHalf, thinInnerHalf, z3],
    [thinInnerHalf, thinInnerHalf, z3],
    [halfSize, halfSize, z3],
    [0, 0, 1]
  );
  
  // Left strip
  addQuad(
    [-halfSize, -halfSize, z3],
    [-thinInnerHalf, -thinInnerHalf, z3],
    [-thinInnerHalf, thinInnerHalf, z3],
    [-halfSize, halfSize, z3],
    [0, 0, 1]
  );
  
  // Right strip
  addQuad(
    [thinInnerHalf, -thinInnerHalf, z3],
    [halfSize, -halfSize, z3],
    [halfSize, halfSize, z3],
    [thinInnerHalf, thinInnerHalf, z3],
    [0, 0, 1]
  );

  // Total triangle count:
  // Bottom face: 1 quad = 2 triangles
  // Outer walls: 4 quads = 8 triangles
  // Base top: 4 quads = 8 triangles
  // Thick inner walls: 4 quads = 8 triangles
  // Transition step: 4 quads = 8 triangles
  // Thin inner walls: 4 quads = 8 triangles
  // Top face: 4 quads = 8 triangles
  // Total: 2 + 8 + 8 + 8 + 8 + 8 + 8 = 50 triangles

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  // Convert to STL format
  const stlString = geometryToSTL(geometry, 'FlowCalibrationCube');
  return new Blob([stlString], { type: 'application/octet-stream' });
}

interface RetractionTestParameters {
  startRetraction: number;
  endRetraction: number;
  retractionStep: number;
  towerDiameter?: number;
  towerSpacing?: number;
  plateWidth?: number;
  plateLength?: number;
  plateThickness?: number;
  layerHeight?: number;
}

export async function generateRetractionTestTower({
  startRetraction = 0,
  endRetraction = 2,
  retractionStep = 0.1
}: RetractionTestParameters): Promise<Blob> {
  // Calculate the maximum height based on OrcaSlicer's formula
  // height = 1.0 + ((end - start) / step)
  const maxHeight = 1.0 + ((endRetraction - startRetraction) / retractionStep);
  
  try {
    // Fetch the template STL file
    const response = await fetch('/templates/retraction_tower_template.stl');
    const templateSTL = await response.text();
    
    // Parse and filter the STL
    const filteredSTL = filterSTLByHeight(templateSTL, maxHeight);
    
    // Return as blob
    return new Blob([filteredSTL], { type: 'application/sla' });
  } catch (error) {
    console.error('Failed to generate retraction test tower:', error);
    throw error;
  }
}

// Function to parse and filter STL triangles by height
function filterSTLByHeight(stlContent: string, maxHeight: number): string {
  const lines = stlContent.split('\n');
  const filteredLines: string[] = [];
  let currentFacet: string[] = [];
  let inFacet = false;
  let facetMaxZ = 0;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('solid')) {
      filteredLines.push(line);
    } else if (trimmedLine.startsWith('endsolid')) {
      filteredLines.push(line);
    } else if (trimmedLine.startsWith('facet normal')) {
      inFacet = true;
      currentFacet = [line];
      facetMaxZ = 0;
    } else if (trimmedLine.startsWith('endfacet')) {
      currentFacet.push(line);
      
      // Only include facet if all vertices are below maxHeight
      if (facetMaxZ <= maxHeight) {
        filteredLines.push(...currentFacet);
      }
      
      inFacet = false;
      currentFacet = [];
    } else if (inFacet) {
      currentFacet.push(line);
      
      // Check if this is a vertex line and extract Z coordinate
      if (trimmedLine.startsWith('vertex')) {
        const parts = trimmedLine.split(/\s+/);
        if (parts.length >= 4) {
          const z = parseFloat(parts[3]);
          facetMaxZ = Math.max(facetMaxZ, z);
        }
      }
    }
  }
  
  return filteredLines.join('\n');
}

function geometryToSTL(geometry: THREE.BufferGeometry, modelName: string = 'Model'): string {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  
  let stl = `solid ${modelName}\n`;
  
  // Process triangles
  for (let i = 0; i < positions.count; i += 3) {
    // Get vertices
    const v1 = new THREE.Vector3(
      positions.getX(i),
      positions.getY(i),
      positions.getZ(i)
    );
    const v2 = new THREE.Vector3(
      positions.getX(i + 1),
      positions.getY(i + 1),
      positions.getZ(i + 1)
    );
    const v3 = new THREE.Vector3(
      positions.getX(i + 2),
      positions.getY(i + 2),
      positions.getZ(i + 2)
    );
    
    // Get normal (use first vertex normal)
    const normal = new THREE.Vector3(
      normals.getX(i),
      normals.getY(i),
      normals.getZ(i)
    );
    
    // Write facet
    stl += `  facet normal ${normal.x} ${normal.y} ${normal.z}\n`;
    stl += '    outer loop\n';
    stl += `      vertex ${v1.x} ${v1.y} ${v1.z}\n`;
    stl += `      vertex ${v2.x} ${v2.y} ${v2.z}\n`;
    stl += `      vertex ${v3.x} ${v3.y} ${v3.z}\n`;
    stl += '    endloop\n';
    stl += '  endfacet\n';
  }
  
  stl += `endsolid ${modelName}\n`;
  return stl;
}