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
  const thickWallThickness = nozzleSize * 3; // 1.2mm for 0.4mm nozzle
  const thinWallThickness = nozzleSize; // 0.4mm for 0.4mm nozzle
  const airGap = nozzleSize * 2; // 0.8mm for 0.4mm nozzle

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
  
  // Inner dimensions for single wall section
  const singleInnerHalf = halfSize - thickWallThickness; // 10 - 1.2 = 8.8mm
  
  // Inner dimensions for double wall section
  const outerWallInnerHalf = halfSize - thinWallThickness; // 10 - 0.4 = 9.6mm
  const innerWallOuterHalf = halfSize - thinWallThickness - airGap; // 10 - 0.4 - 0.8 = 8.8mm

  // 1. BOTTOM FACE (solid base at z=0)
  addQuad(
    [-halfSize, -halfSize, z0],
    [-halfSize, halfSize, z0],
    [halfSize, halfSize, z0],
    [halfSize, -halfSize, z0],
    [0, 0, -1]
  );

  // 2. TOP OF BASE (z=baseHeight) with hole for single wall cavity
  // Front strip
  addQuad(
    [-halfSize, -halfSize, z1],
    [halfSize, -halfSize, z1],
    [singleInnerHalf, -singleInnerHalf, z1],
    [-singleInnerHalf, -singleInnerHalf, z1],
    [0, 0, 1]
  );
  
  // Back strip
  addQuad(
    [-halfSize, halfSize, z1],
    [-singleInnerHalf, singleInnerHalf, z1],
    [singleInnerHalf, singleInnerHalf, z1],
    [halfSize, halfSize, z1],
    [0, 0, 1]
  );
  
  // Left strip
  addQuad(
    [-halfSize, -halfSize, z1],
    [-singleInnerHalf, -singleInnerHalf, z1],
    [-singleInnerHalf, singleInnerHalf, z1],
    [-halfSize, halfSize, z1],
    [0, 0, 1]
  );
  
  // Right strip
  addQuad(
    [singleInnerHalf, -singleInnerHalf, z1],
    [halfSize, -halfSize, z1],
    [halfSize, halfSize, z1],
    [singleInnerHalf, singleInnerHalf, z1],
    [0, 0, 1]
  );

  // 3. OUTER WALLS (from z0 to z3) - Split into sections for proper connection
  
  // Outer walls - bottom to base height
  addQuad([-halfSize, -halfSize, z0], [halfSize, -halfSize, z0], [halfSize, -halfSize, z1], [-halfSize, -halfSize, z1], [0, -1, 0]);
  addQuad([-halfSize, halfSize, z0], [-halfSize, halfSize, z1], [halfSize, halfSize, z1], [halfSize, halfSize, z0], [0, 1, 0]);
  addQuad([-halfSize, -halfSize, z0], [-halfSize, -halfSize, z1], [-halfSize, halfSize, z1], [-halfSize, halfSize, z0], [-1, 0, 0]);
  addQuad([halfSize, -halfSize, z0], [halfSize, halfSize, z0], [halfSize, halfSize, z1], [halfSize, -halfSize, z1], [1, 0, 0]);
  
  // Outer walls - base to single wall top
  addQuad([-halfSize, -halfSize, z1], [halfSize, -halfSize, z1], [halfSize, -halfSize, z2], [-halfSize, -halfSize, z2], [0, -1, 0]);
  addQuad([-halfSize, halfSize, z1], [-halfSize, halfSize, z2], [halfSize, halfSize, z2], [halfSize, halfSize, z1], [0, 1, 0]);
  addQuad([-halfSize, -halfSize, z1], [-halfSize, -halfSize, z2], [-halfSize, halfSize, z2], [-halfSize, halfSize, z1], [-1, 0, 0]);
  addQuad([halfSize, -halfSize, z1], [halfSize, halfSize, z1], [halfSize, halfSize, z2], [halfSize, -halfSize, z2], [1, 0, 0]);
  
  // Outer walls - single wall top to top
  addQuad([-halfSize, -halfSize, z2], [halfSize, -halfSize, z2], [halfSize, -halfSize, z3], [-halfSize, -halfSize, z3], [0, -1, 0]);
  addQuad([-halfSize, halfSize, z2], [-halfSize, halfSize, z3], [halfSize, halfSize, z3], [halfSize, halfSize, z2], [0, 1, 0]);
  addQuad([-halfSize, -halfSize, z2], [-halfSize, -halfSize, z3], [-halfSize, halfSize, z3], [-halfSize, halfSize, z2], [-1, 0, 0]);
  addQuad([halfSize, -halfSize, z2], [halfSize, halfSize, z2], [halfSize, halfSize, z3], [halfSize, -halfSize, z3], [1, 0, 0]);

  // 4. SINGLE WALL SECTION - Inner walls (z1 to z2)
  
  // Front inner wall
  addQuad(
    [-singleInnerHalf, -singleInnerHalf, z1],
    [singleInnerHalf, -singleInnerHalf, z1],
    [singleInnerHalf, -singleInnerHalf, z2],
    [-singleInnerHalf, -singleInnerHalf, z2],
    [0, 1, 0]
  );
  
  // Back inner wall
  addQuad(
    [-singleInnerHalf, singleInnerHalf, z1],
    [-singleInnerHalf, singleInnerHalf, z2],
    [singleInnerHalf, singleInnerHalf, z2],
    [singleInnerHalf, singleInnerHalf, z1],
    [0, -1, 0]
  );
  
  // Left inner wall
  addQuad(
    [-singleInnerHalf, -singleInnerHalf, z1],
    [-singleInnerHalf, -singleInnerHalf, z2],
    [-singleInnerHalf, singleInnerHalf, z2],
    [-singleInnerHalf, singleInnerHalf, z1],
    [1, 0, 0]
  );
  
  // Right inner wall
  addQuad(
    [singleInnerHalf, -singleInnerHalf, z1],
    [singleInnerHalf, singleInnerHalf, z1],
    [singleInnerHalf, singleInnerHalf, z2],
    [singleInnerHalf, -singleInnerHalf, z2],
    [-1, 0, 0]
  );

  // 5. TRANSITION PLATFORM (z2) - connects single wall to double wall
  // This is the platform with multiple rings for the double wall structure
  
  // Outermost ring (from cube edge to outer wall inner edge)
  addQuad([-halfSize, -halfSize, z2], [halfSize, -halfSize, z2], [outerWallInnerHalf, -outerWallInnerHalf, z2], [-outerWallInnerHalf, -outerWallInnerHalf, z2], [0, 0, 1]);
  addQuad([-halfSize, halfSize, z2], [-outerWallInnerHalf, outerWallInnerHalf, z2], [outerWallInnerHalf, outerWallInnerHalf, z2], [halfSize, halfSize, z2], [0, 0, 1]);
  addQuad([-halfSize, -halfSize, z2], [-outerWallInnerHalf, -outerWallInnerHalf, z2], [-outerWallInnerHalf, outerWallInnerHalf, z2], [-halfSize, halfSize, z2], [0, 0, 1]);
  addQuad([outerWallInnerHalf, -outerWallInnerHalf, z2], [halfSize, -halfSize, z2], [halfSize, halfSize, z2], [outerWallInnerHalf, outerWallInnerHalf, z2], [0, 0, 1]);
  
  // Middle ring (air gap - from outer wall inner to inner wall outer)
  addQuad([-outerWallInnerHalf, -outerWallInnerHalf, z2], [outerWallInnerHalf, -outerWallInnerHalf, z2], [innerWallOuterHalf, -innerWallOuterHalf, z2], [-innerWallOuterHalf, -innerWallOuterHalf, z2], [0, 0, 1]);
  addQuad([-outerWallInnerHalf, outerWallInnerHalf, z2], [-innerWallOuterHalf, innerWallOuterHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z2], [outerWallInnerHalf, outerWallInnerHalf, z2], [0, 0, 1]);
  addQuad([-outerWallInnerHalf, -outerWallInnerHalf, z2], [-innerWallOuterHalf, -innerWallOuterHalf, z2], [-innerWallOuterHalf, innerWallOuterHalf, z2], [-outerWallInnerHalf, outerWallInnerHalf, z2], [0, 0, 1]);
  addQuad([innerWallOuterHalf, -innerWallOuterHalf, z2], [outerWallInnerHalf, -outerWallInnerHalf, z2], [outerWallInnerHalf, outerWallInnerHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z2], [0, 0, 1]);
  
  // Innermost connection (from inner wall outer to single wall cavity)
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z2], [innerWallOuterHalf, -innerWallOuterHalf, z2], [singleInnerHalf, -singleInnerHalf, z2], [-singleInnerHalf, -singleInnerHalf, z2], [0, 0, 1]);
  addQuad([-innerWallOuterHalf, innerWallOuterHalf, z2], [-singleInnerHalf, singleInnerHalf, z2], [singleInnerHalf, singleInnerHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z2], [0, 0, 1]);
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z2], [-singleInnerHalf, -singleInnerHalf, z2], [-singleInnerHalf, singleInnerHalf, z2], [-innerWallOuterHalf, innerWallOuterHalf, z2], [0, 0, 1]);
  addQuad([singleInnerHalf, -singleInnerHalf, z2], [innerWallOuterHalf, -innerWallOuterHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z2], [singleInnerHalf, singleInnerHalf, z2], [0, 0, 1]);

  // 6. DOUBLE WALL SECTION - Outer thin walls (z2 to z3)
  
  // Outer wall inner faces
  addQuad([-outerWallInnerHalf, -outerWallInnerHalf, z2], [outerWallInnerHalf, -outerWallInnerHalf, z2], [outerWallInnerHalf, -outerWallInnerHalf, z3], [-outerWallInnerHalf, -outerWallInnerHalf, z3], [0, 1, 0]);
  addQuad([-outerWallInnerHalf, outerWallInnerHalf, z2], [-outerWallInnerHalf, outerWallInnerHalf, z3], [outerWallInnerHalf, outerWallInnerHalf, z3], [outerWallInnerHalf, outerWallInnerHalf, z2], [0, -1, 0]);
  addQuad([-outerWallInnerHalf, -outerWallInnerHalf, z2], [-outerWallInnerHalf, -outerWallInnerHalf, z3], [-outerWallInnerHalf, outerWallInnerHalf, z3], [-outerWallInnerHalf, outerWallInnerHalf, z2], [1, 0, 0]);
  addQuad([outerWallInnerHalf, -outerWallInnerHalf, z2], [outerWallInnerHalf, outerWallInnerHalf, z2], [outerWallInnerHalf, outerWallInnerHalf, z3], [outerWallInnerHalf, -outerWallInnerHalf, z3], [-1, 0, 0]);

  // 7. DOUBLE WALL SECTION - Inner thin walls (z2 to z3)
  
  // Inner wall outer faces (facing the air gap)
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z2], [innerWallOuterHalf, -innerWallOuterHalf, z2], [innerWallOuterHalf, -innerWallOuterHalf, z3], [-innerWallOuterHalf, -innerWallOuterHalf, z3], [0, -1, 0]);
  addQuad([-innerWallOuterHalf, innerWallOuterHalf, z2], [-innerWallOuterHalf, innerWallOuterHalf, z3], [innerWallOuterHalf, innerWallOuterHalf, z3], [innerWallOuterHalf, innerWallOuterHalf, z2], [0, 1, 0]);
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z2], [-innerWallOuterHalf, -innerWallOuterHalf, z3], [-innerWallOuterHalf, innerWallOuterHalf, z3], [-innerWallOuterHalf, innerWallOuterHalf, z2], [-1, 0, 0]);
  addQuad([innerWallOuterHalf, -innerWallOuterHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z2], [innerWallOuterHalf, innerWallOuterHalf, z3], [innerWallOuterHalf, -innerWallOuterHalf, z3], [1, 0, 0]);
  
  // Inner wall inner faces (facing the cavity)
  addQuad([-singleInnerHalf, -singleInnerHalf, z2], [singleInnerHalf, -singleInnerHalf, z2], [singleInnerHalf, -singleInnerHalf, z3], [-singleInnerHalf, -singleInnerHalf, z3], [0, 1, 0]);
  addQuad([-singleInnerHalf, singleInnerHalf, z2], [-singleInnerHalf, singleInnerHalf, z3], [singleInnerHalf, singleInnerHalf, z3], [singleInnerHalf, singleInnerHalf, z2], [0, -1, 0]);
  addQuad([-singleInnerHalf, -singleInnerHalf, z2], [-singleInnerHalf, -singleInnerHalf, z3], [-singleInnerHalf, singleInnerHalf, z3], [-singleInnerHalf, singleInnerHalf, z2], [1, 0, 0]);
  addQuad([singleInnerHalf, -singleInnerHalf, z2], [singleInnerHalf, singleInnerHalf, z2], [singleInnerHalf, singleInnerHalf, z3], [singleInnerHalf, -singleInnerHalf, z3], [-1, 0, 0]);

  // 8. TOP FACE (z3) - Multiple rings for double wall structure
  
  // Outer ring (cube edge to outer wall inner)
  addQuad([-halfSize, -halfSize, z3], [halfSize, -halfSize, z3], [outerWallInnerHalf, -outerWallInnerHalf, z3], [-outerWallInnerHalf, -outerWallInnerHalf, z3], [0, 0, 1]);
  addQuad([-halfSize, halfSize, z3], [-outerWallInnerHalf, outerWallInnerHalf, z3], [outerWallInnerHalf, outerWallInnerHalf, z3], [halfSize, halfSize, z3], [0, 0, 1]);
  addQuad([-halfSize, -halfSize, z3], [-outerWallInnerHalf, -outerWallInnerHalf, z3], [-outerWallInnerHalf, outerWallInnerHalf, z3], [-halfSize, halfSize, z3], [0, 0, 1]);
  addQuad([outerWallInnerHalf, -outerWallInnerHalf, z3], [halfSize, -halfSize, z3], [halfSize, halfSize, z3], [outerWallInnerHalf, outerWallInnerHalf, z3], [0, 0, 1]);
  
  // Inner ring (inner wall outer to inner wall inner/cavity)
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z3], [innerWallOuterHalf, -innerWallOuterHalf, z3], [singleInnerHalf, -singleInnerHalf, z3], [-singleInnerHalf, -singleInnerHalf, z3], [0, 0, 1]);
  addQuad([-innerWallOuterHalf, innerWallOuterHalf, z3], [-singleInnerHalf, singleInnerHalf, z3], [singleInnerHalf, singleInnerHalf, z3], [innerWallOuterHalf, innerWallOuterHalf, z3], [0, 0, 1]);
  addQuad([-innerWallOuterHalf, -innerWallOuterHalf, z3], [-singleInnerHalf, -singleInnerHalf, z3], [-singleInnerHalf, singleInnerHalf, z3], [-innerWallOuterHalf, innerWallOuterHalf, z3], [0, 0, 1]);
  addQuad([singleInnerHalf, -singleInnerHalf, z3], [innerWallOuterHalf, -innerWallOuterHalf, z3], [innerWallOuterHalf, innerWallOuterHalf, z3], [singleInnerHalf, singleInnerHalf, z3], [0, 0, 1]);

  // Set geometry attributes
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  // Convert to STL format
  const stlString = geometryToSTL(geometry);
  return new Blob([stlString], { type: 'application/octet-stream' });
}

function geometryToSTL(geometry: THREE.BufferGeometry): string {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  
  let stl = 'solid FlowCalibrationCube\n';
  
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
  
  stl += 'endsolid FlowCalibrationCube\n';
  return stl;
}