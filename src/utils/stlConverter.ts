/**
 * STL File Format Converter
 * Converts between binary and ASCII STL formats
 */

export interface STLTriangle {
  normal: { x: number; y: number; z: number };
  vertices: Array<{ x: number; y: number; z: number }>;
}

/**
 * Parse binary STL file
 */
export function parseBinarySTL(buffer: ArrayBuffer): STLTriangle[] {
  const dataView = new DataView(buffer);
  const triangles: STLTriangle[] = [];
  
  // Skip 80-byte header
  let offset = 80;
  
  // Read number of triangles (4 bytes)
  const numTriangles = dataView.getUint32(offset, true);
  offset += 4;
  
  // Read each triangle (50 bytes each)
  for (let i = 0; i < numTriangles; i++) {
    // Read normal vector (12 bytes)
    const normal = {
      x: dataView.getFloat32(offset, true),
      y: dataView.getFloat32(offset + 4, true),
      z: dataView.getFloat32(offset + 8, true)
    };
    offset += 12;
    
    // Read 3 vertices (36 bytes total, 12 bytes each)
    const vertices = [];
    for (let j = 0; j < 3; j++) {
      vertices.push({
        x: dataView.getFloat32(offset, true),
        y: dataView.getFloat32(offset + 4, true),
        z: dataView.getFloat32(offset + 8, true)
      });
      offset += 12;
    }
    
    // Skip attribute byte count (2 bytes)
    offset += 2;
    
    triangles.push({ normal, vertices });
  }
  
  return triangles;
}

/**
 * Convert triangles to ASCII STL format
 */
export function trianglesToASCII(triangles: STLTriangle[], name: string = 'Model'): string {
  let ascii = `solid ${name}\n`;
  
  for (const triangle of triangles) {
    // Write facet normal
    ascii += `  facet normal ${triangle.normal.x.toExponential(6)} ${triangle.normal.y.toExponential(6)} ${triangle.normal.z.toExponential(6)}\n`;
    ascii += '    outer loop\n';
    
    // Write vertices
    for (const vertex of triangle.vertices) {
      ascii += `      vertex ${vertex.x.toExponential(6)} ${vertex.y.toExponential(6)} ${vertex.z.toExponential(6)}\n`;
    }
    
    ascii += '    endloop\n';
    ascii += '  endfacet\n';
  }
  
  ascii += `endsolid ${name}\n`;
  return ascii;
}

/**
 * Convert binary STL to ASCII STL
 */
export async function binaryToAsciiSTL(binaryData: ArrayBuffer, name?: string): Promise<string> {
  const triangles = parseBinarySTL(binaryData);
  return trianglesToASCII(triangles, name);
}

/**
 * Load and convert STL file from URL
 */
export async function convertSTLFromURL(url: string, name?: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  
  // Check if it's already ASCII
  const text = new TextDecoder().decode(buffer.slice(0, 5));
  if (text === 'solid') {
    // Already ASCII, return as-is
    return new TextDecoder().decode(buffer);
  }
  
  // Convert binary to ASCII
  return binaryToAsciiSTL(buffer, name);
}

/**
 * Filter STL triangles by maximum Z height
 */
export function filterTrianglesByHeight(triangles: STLTriangle[], maxHeight: number): STLTriangle[] {
  return triangles.filter(triangle => {
    // Check if all vertices are below maxHeight
    return triangle.vertices.every(v => v.z <= maxHeight);
  });
}

/**
 * Parse ASCII STL to triangles
 */
export function parseAsciiSTL(asciiContent: string): STLTriangle[] {
  const triangles: STLTriangle[] = [];
  const lines = asciiContent.split('\n');
  
  let currentTriangle: Partial<STLTriangle> = {};
  let vertices: Array<{ x: number; y: number; z: number }> = [];
  let inFacet = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('facet normal')) {
      inFacet = true;
      const parts = trimmed.split(/\s+/);
      currentTriangle.normal = {
        x: parseFloat(parts[2]),
        y: parseFloat(parts[3]),
        z: parseFloat(parts[4])
      };
      vertices = [];
    } else if (trimmed.startsWith('vertex') && inFacet) {
      const parts = trimmed.split(/\s+/);
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      });
    } else if (trimmed === 'endfacet' && inFacet) {
      if (currentTriangle.normal && vertices.length === 3) {
        triangles.push({
          normal: currentTriangle.normal,
          vertices
        });
      }
      inFacet = false;
      currentTriangle = {};
    }
  }
  
  return triangles;
}

/**
 * Filter ASCII STL content by height
 */
export function filterAsciiSTLByHeight(asciiContent: string, maxHeight: number): string {
  const match = asciiContent.match(/^solid\s+(.*)$/m);
  const name = match ? match[1] : 'Model';
  
  const triangles = parseAsciiSTL(asciiContent);
  const filtered = filterTrianglesByHeight(triangles, maxHeight);
  
  return trianglesToASCII(filtered, name);
}