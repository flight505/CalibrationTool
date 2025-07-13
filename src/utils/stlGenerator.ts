import * as THREE from 'three';

interface CubeParameters {
  nozzleSize: number;
  cubeSize?: number;
  dividerHeight?: number;
}

export function generateFlowCalibrationCube({
  nozzleSize,
  cubeSize = 30,
  dividerHeight = 10
}: CubeParameters): Blob {
  // Create scene
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];

  // Wall thickness based on nozzle size
  const singleWallThickness = nozzleSize;
  const tripleWallThickness = nozzleSize * 3;

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

  // Bottom section (triple wall) - outer walls
  // Front wall
  addQuad(
    [-halfSize, -halfSize, 0],
    [halfSize, -halfSize, 0],
    [halfSize, -halfSize, dividerHeight],
    [-halfSize, -halfSize, dividerHeight],
    [0, -1, 0]
  );
  
  // Back wall
  addQuad(
    [-halfSize, halfSize - tripleWallThickness, 0],
    [-halfSize, halfSize - tripleWallThickness, dividerHeight],
    [halfSize, halfSize - tripleWallThickness, dividerHeight],
    [halfSize, halfSize - tripleWallThickness, 0],
    [0, 1, 0]
  );

  // Left wall
  addQuad(
    [-halfSize, -halfSize, 0],
    [-halfSize, -halfSize, dividerHeight],
    [-halfSize, halfSize, dividerHeight],
    [-halfSize, halfSize, 0],
    [-1, 0, 0]
  );

  // Right wall
  addQuad(
    [halfSize - tripleWallThickness, -halfSize, 0],
    [halfSize - tripleWallThickness, halfSize, 0],
    [halfSize - tripleWallThickness, halfSize, dividerHeight],
    [halfSize - tripleWallThickness, -halfSize, dividerHeight],
    [1, 0, 0]
  );

  // Inner walls for triple wall
  // Inner front wall
  addQuad(
    [-halfSize + tripleWallThickness, -halfSize + tripleWallThickness, 0],
    [halfSize - tripleWallThickness, -halfSize + tripleWallThickness, 0],
    [halfSize - tripleWallThickness, -halfSize + tripleWallThickness, dividerHeight],
    [-halfSize + tripleWallThickness, -halfSize + tripleWallThickness, dividerHeight],
    [0, 1, 0]
  );

  // Inner back wall
  addQuad(
    [-halfSize + tripleWallThickness, halfSize - tripleWallThickness, 0],
    [-halfSize + tripleWallThickness, halfSize - tripleWallThickness, dividerHeight],
    [halfSize - tripleWallThickness, halfSize - tripleWallThickness, dividerHeight],
    [halfSize - tripleWallThickness, halfSize - tripleWallThickness, 0],
    [0, -1, 0]
  );

  // Divider platform
  addQuad(
    [-halfSize + tripleWallThickness, -halfSize + tripleWallThickness, dividerHeight],
    [halfSize - tripleWallThickness, -halfSize + tripleWallThickness, dividerHeight],
    [halfSize - tripleWallThickness, halfSize - tripleWallThickness, dividerHeight],
    [-halfSize + tripleWallThickness, halfSize - tripleWallThickness, dividerHeight],
    [0, 0, 1]
  );

  // Top section (single wall)
  const topHeight = cubeSize;
  
  // Outer walls for single wall section
  // Front wall
  addQuad(
    [-halfSize, -halfSize, dividerHeight],
    [halfSize, -halfSize, dividerHeight],
    [halfSize, -halfSize, topHeight],
    [-halfSize, -halfSize, topHeight],
    [0, -1, 0]
  );

  // Back wall
  addQuad(
    [-halfSize, halfSize, dividerHeight],
    [-halfSize, halfSize, topHeight],
    [halfSize, halfSize, topHeight],
    [halfSize, halfSize, dividerHeight],
    [0, 1, 0]
  );

  // Left wall
  addQuad(
    [-halfSize, -halfSize, dividerHeight],
    [-halfSize, -halfSize, topHeight],
    [-halfSize, halfSize, topHeight],
    [-halfSize, halfSize, dividerHeight],
    [-1, 0, 0]
  );

  // Right wall
  addQuad(
    [halfSize, -halfSize, dividerHeight],
    [halfSize, halfSize, dividerHeight],
    [halfSize, halfSize, topHeight],
    [halfSize, -halfSize, topHeight],
    [1, 0, 0]
  );

  // Inner walls for single wall section
  // Inner front wall
  addQuad(
    [-halfSize + singleWallThickness, -halfSize + singleWallThickness, dividerHeight],
    [halfSize - singleWallThickness, -halfSize + singleWallThickness, dividerHeight],
    [halfSize - singleWallThickness, -halfSize + singleWallThickness, topHeight],
    [-halfSize + singleWallThickness, -halfSize + singleWallThickness, topHeight],
    [0, 1, 0]
  );

  // Inner back wall
  addQuad(
    [-halfSize + singleWallThickness, halfSize - singleWallThickness, dividerHeight],
    [-halfSize + singleWallThickness, halfSize - singleWallThickness, topHeight],
    [halfSize - singleWallThickness, halfSize - singleWallThickness, topHeight],
    [halfSize - singleWallThickness, halfSize - singleWallThickness, dividerHeight],
    [0, -1, 0]
  );

  // Inner left wall
  addQuad(
    [-halfSize + singleWallThickness, -halfSize + singleWallThickness, dividerHeight],
    [-halfSize + singleWallThickness, -halfSize + singleWallThickness, topHeight],
    [-halfSize + singleWallThickness, halfSize - singleWallThickness, topHeight],
    [-halfSize + singleWallThickness, halfSize - singleWallThickness, dividerHeight],
    [1, 0, 0]
  );

  // Inner right wall
  addQuad(
    [halfSize - singleWallThickness, -halfSize + singleWallThickness, dividerHeight],
    [halfSize - singleWallThickness, halfSize - singleWallThickness, dividerHeight],
    [halfSize - singleWallThickness, halfSize - singleWallThickness, topHeight],
    [halfSize - singleWallThickness, -halfSize + singleWallThickness, topHeight],
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