import * as THREE from 'three';

interface CubeParameters {
  nozzleSize: number;
  cubeSize?: number;
  bottomHeight?: number;
  topHeight?: number;
}

export function generateFlowCalibrationCube({
  nozzleSize,
  cubeSize = 20,
  bottomHeight = 9,
  topHeight = 10
}: CubeParameters): Blob {
  // Create scene
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];

  // Wall thickness based on nozzle size
  const singleWallThickness = nozzleSize;
  // For 0.4mm nozzle: double wall total thickness = 1.2mm (matches drawing)
  // This represents the total wall thickness from outer to inner surface
  const doubleWallTotal = nozzleSize * 3; // 1.2mm for 0.4mm nozzle

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

  // Create the dual-wall calibration cube
  const halfSize = cubeSize / 2;
  const totalHeight = bottomHeight + topHeight;

  // Bottom section (double wall) - from 0 to bottomHeight (9mm)
  // The double wall has total thickness of 1.2mm (for 0.4mm nozzle)
  // This creates an inner cavity of 17.6mm x 17.6mm
  const bottomInnerHalf = halfSize - doubleWallTotal;

  // Outer walls of bottom section
  // Front wall
  addQuad(
    [-halfSize, -halfSize, 0],
    [halfSize, -halfSize, 0],
    [halfSize, -halfSize, bottomHeight],
    [-halfSize, -halfSize, bottomHeight],
    [0, -1, 0]
  );
  
  // Back wall
  addQuad(
    [-halfSize, halfSize, 0],
    [-halfSize, halfSize, bottomHeight],
    [halfSize, halfSize, bottomHeight],
    [halfSize, halfSize, 0],
    [0, 1, 0]
  );

  // Left wall
  addQuad(
    [-halfSize, -halfSize, 0],
    [-halfSize, -halfSize, bottomHeight],
    [-halfSize, halfSize, bottomHeight],
    [-halfSize, halfSize, 0],
    [-1, 0, 0]
  );

  // Right wall
  addQuad(
    [halfSize, -halfSize, 0],
    [halfSize, halfSize, 0],
    [halfSize, halfSize, bottomHeight],
    [halfSize, -halfSize, bottomHeight],
    [1, 0, 0]
  );

  // Inner walls of bottom section
  // Front inner wall
  addQuad(
    [-bottomInnerHalf, -bottomInnerHalf, 0],
    [bottomInnerHalf, -bottomInnerHalf, 0],
    [bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [-bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [0, 1, 0]
  );

  // Back inner wall
  addQuad(
    [-bottomInnerHalf, bottomInnerHalf, 0],
    [-bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, bottomInnerHalf, 0],
    [0, -1, 0]
  );

  // Left inner wall
  addQuad(
    [-bottomInnerHalf, -bottomInnerHalf, 0],
    [-bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [-bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [-bottomInnerHalf, bottomInnerHalf, 0],
    [1, 0, 0]
  );

  // Right inner wall
  addQuad(
    [bottomInnerHalf, -bottomInnerHalf, 0],
    [bottomInnerHalf, bottomInnerHalf, 0],
    [bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [-1, 0, 0]
  );

  // Bottom face
  addQuad(
    [-halfSize, -halfSize, 0],
    [-halfSize, halfSize, 0],
    [halfSize, halfSize, 0],
    [halfSize, -halfSize, 0],
    [0, 0, -1]
  );

  // Divider platform at bottomHeight
  addQuad(
    [-bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [-bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [0, 0, 1]
  );

  // Top section (single wall) - from bottomHeight to totalHeight
  const topInnerHalf = halfSize - singleWallThickness;
  
  // Outer walls of top section
  // Front wall
  addQuad(
    [-halfSize, -halfSize, bottomHeight],
    [halfSize, -halfSize, bottomHeight],
    [halfSize, -halfSize, totalHeight],
    [-halfSize, -halfSize, totalHeight],
    [0, -1, 0]
  );

  // Back wall
  addQuad(
    [-halfSize, halfSize, bottomHeight],
    [-halfSize, halfSize, totalHeight],
    [halfSize, halfSize, totalHeight],
    [halfSize, halfSize, bottomHeight],
    [0, 1, 0]
  );

  // Left wall
  addQuad(
    [-halfSize, -halfSize, bottomHeight],
    [-halfSize, -halfSize, totalHeight],
    [-halfSize, halfSize, totalHeight],
    [-halfSize, halfSize, bottomHeight],
    [-1, 0, 0]
  );

  // Right wall
  addQuad(
    [halfSize, -halfSize, bottomHeight],
    [halfSize, halfSize, bottomHeight],
    [halfSize, halfSize, totalHeight],
    [halfSize, -halfSize, totalHeight],
    [1, 0, 0]
  );

  // Inner walls of top section
  // Front inner wall
  addQuad(
    [-topInnerHalf, -topInnerHalf, bottomHeight],
    [topInnerHalf, -topInnerHalf, bottomHeight],
    [topInnerHalf, -topInnerHalf, totalHeight],
    [-topInnerHalf, -topInnerHalf, totalHeight],
    [0, 1, 0]
  );

  // Back inner wall
  addQuad(
    [-topInnerHalf, topInnerHalf, bottomHeight],
    [-topInnerHalf, topInnerHalf, totalHeight],
    [topInnerHalf, topInnerHalf, totalHeight],
    [topInnerHalf, topInnerHalf, bottomHeight],
    [0, -1, 0]
  );

  // Left inner wall
  addQuad(
    [-topInnerHalf, -topInnerHalf, bottomHeight],
    [-topInnerHalf, -topInnerHalf, totalHeight],
    [-topInnerHalf, topInnerHalf, totalHeight],
    [-topInnerHalf, topInnerHalf, bottomHeight],
    [1, 0, 0]
  );

  // Right inner wall
  addQuad(
    [topInnerHalf, -topInnerHalf, bottomHeight],
    [topInnerHalf, topInnerHalf, bottomHeight],
    [topInnerHalf, topInnerHalf, totalHeight],
    [topInnerHalf, -topInnerHalf, totalHeight],
    [-1, 0, 0]
  );

  // Connection walls between bottom inner cavity and top inner cavity
  // These create the transition from the smaller bottom cavity to the larger top cavity
  // Front transition
  addQuad(
    [-bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [-topInnerHalf, -topInnerHalf, bottomHeight],
    [topInnerHalf, -topInnerHalf, bottomHeight],
    [bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [0, 0, 1]
  );

  // Back transition
  addQuad(
    [-bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [topInnerHalf, topInnerHalf, bottomHeight],
    [-topInnerHalf, topInnerHalf, bottomHeight],
    [0, 0, 1]
  );

  // Left transition
  addQuad(
    [-bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [-bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [-topInnerHalf, topInnerHalf, bottomHeight],
    [-topInnerHalf, -topInnerHalf, bottomHeight],
    [0, 0, 1]
  );

  // Right transition
  addQuad(
    [bottomInnerHalf, -bottomInnerHalf, bottomHeight],
    [topInnerHalf, -topInnerHalf, bottomHeight],
    [topInnerHalf, topInnerHalf, bottomHeight],
    [bottomInnerHalf, bottomInnerHalf, bottomHeight],
    [0, 0, 1]
  );

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