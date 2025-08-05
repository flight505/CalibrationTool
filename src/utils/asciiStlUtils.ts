// ASCII STL Utility Functions for unified STL manipulation

export interface Vertex {
  x: number;
  y: number;
  z: number;
}

export interface Normal {
  x: number;
  y: number;
  z: number;
}

export interface Triangle {
  normal: Normal;
  vertices: [Vertex, Vertex, Vertex];
}

export interface ParsedSTL {
  name: string;
  triangles: Triangle[];
}

export interface BoundingBox {
  min: Vertex;
  max: Vertex;
  center: Vertex;
  size: Vertex;
}

export type TransformFunction = (vertex: Vertex) => Vertex;

/**
 * Parse ASCII STL content into structured data
 */
export function parseAsciiStl(stlContent: string): ParsedSTL {
  const lines = stlContent.split('\n');
  const triangles: Triangle[] = [];
  let currentTriangle: Partial<Triangle> = {};
  let vertices: Vertex[] = [];
  let name = 'Model';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('solid')) {
      name = trimmedLine.replace('solid', '').trim() || 'Model';
    } else if (trimmedLine.startsWith('facet normal')) {
      const parts = trimmedLine.split(/\s+/);
      currentTriangle.normal = {
        x: parseFloat(parts[2]),
        y: parseFloat(parts[3]),
        z: parseFloat(parts[4])
      };
      vertices = [];
    } else if (trimmedLine.startsWith('vertex')) {
      const parts = trimmedLine.split(/\s+/);
      vertices.push({
        x: parseFloat(parts[1]),
        y: parseFloat(parts[2]),
        z: parseFloat(parts[3])
      });
    } else if (trimmedLine.startsWith('endfacet')) {
      if (vertices.length === 3 && currentTriangle.normal) {
        triangles.push({
          normal: currentTriangle.normal,
          vertices: vertices as [Vertex, Vertex, Vertex]
        });
      }
      currentTriangle = {};
      vertices = [];
    }
  }
  
  return { name, triangles };
}

/**
 * Convert parsed STL back to ASCII STL string
 */
export function stlToString(stl: ParsedSTL): string {
  let output = `solid ${stl.name}\n`;
  
  for (const triangle of stl.triangles) {
    const n = triangle.normal;
    output += ` facet normal ${n.x} ${n.y} ${n.z}\n`;
    output += '  outer loop\n';
    for (const vertex of triangle.vertices) {
      output += `   vertex ${vertex.x} ${vertex.y} ${vertex.z}\n`;
    }
    output += '  endloop\n';
    output += ' endfacet\n\n';
  }
  
  output += `endsolid ${stl.name}\n`;
  return output;
}

/**
 * Apply a transformation function to all vertices
 */
export function modifyVertices(stl: ParsedSTL, transform: TransformFunction): ParsedSTL {
  return {
    name: stl.name,
    triangles: stl.triangles.map(triangle => ({
      normal: triangle.normal,
      vertices: triangle.vertices.map(transform) as [Vertex, Vertex, Vertex]
    }))
  };
}

/**
 * Filter triangles by maximum Z height
 */
export function filterByHeight(stl: ParsedSTL, maxHeight: number): ParsedSTL {
  return {
    name: stl.name,
    triangles: stl.triangles.filter(triangle => 
      triangle.vertices.every(v => v.z <= maxHeight)
    )
  };
}

/**
 * Scale STL by given factors
 */
export function scaleStl(stl: ParsedSTL, scaleX: number, scaleY: number, scaleZ: number): ParsedSTL {
  return modifyVertices(stl, vertex => ({
    x: vertex.x * scaleX,
    y: vertex.y * scaleY,
    z: vertex.z * scaleZ
  }));
}

/**
 * Translate STL by given offset
 */
export function translateStl(stl: ParsedSTL, offsetX: number, offsetY: number, offsetZ: number): ParsedSTL {
  return modifyVertices(stl, vertex => ({
    x: vertex.x + offsetX,
    y: vertex.y + offsetY,
    z: vertex.z + offsetZ
  }));
}

/**
 * Get bounding box of STL
 */
export function getBoundingBox(stl: ParsedSTL): BoundingBox {
  if (stl.triangles.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
      center: { x: 0, y: 0, z: 0 },
      size: { x: 0, y: 0, z: 0 }
    };
  }
  
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  
  for (const triangle of stl.triangles) {
    for (const vertex of triangle.vertices) {
      minX = Math.min(minX, vertex.x);
      minY = Math.min(minY, vertex.y);
      minZ = Math.min(minZ, vertex.z);
      maxX = Math.max(maxX, vertex.x);
      maxY = Math.max(maxY, vertex.y);
      maxZ = Math.max(maxZ, vertex.z);
    }
  }
  
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center: { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 },
    size: { x: maxX - minX, y: maxY - minY, z: maxZ - minZ }
  };
}

/**
 * Center STL at origin
 */
export function centerAtOrigin(stl: ParsedSTL): ParsedSTL {
  const bbox = getBoundingBox(stl);
  return translateStl(stl, -bbox.center.x, -bbox.center.y, -bbox.min.z);
}

/**
 * Replicate STL in a grid pattern
 */
export function replicateGrid(
  stl: ParsedSTL, 
  countX: number, 
  countY: number, 
  spacingX: number, 
  spacingY: number
): ParsedSTL {
  const bbox = getBoundingBox(stl);
  const combinedTriangles: Triangle[] = [];
  
  for (let i = 0; i < countX; i++) {
    for (let j = 0; j < countY; j++) {
      const offsetX = i * (bbox.size.x + spacingX);
      const offsetY = j * (bbox.size.y + spacingY);
      
      const translated = translateStl(stl, offsetX, offsetY, 0);
      combinedTriangles.push(...translated.triangles);
    }
  }
  
  return {
    name: stl.name,
    triangles: combinedTriangles
  };
}

/**
 * Replicate STL in a circular/radial pattern
 */
export function replicateRadial(
  stl: ParsedSTL,
  radius: number,
  count: number,
  includeCenter: boolean = true
): ParsedSTL {
  const centered = centerAtOrigin(stl);
  const combinedTriangles: Triangle[] = [];
  
  if (includeCenter) {
    combinedTriangles.push(...centered.triangles);
  }
  
  const angleStep = (2 * Math.PI) / count;
  
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep;
    const offsetX = radius * Math.cos(angle);
    const offsetY = radius * Math.sin(angle);
    
    const translated = translateStl(centered, offsetX, offsetY, 0);
    combinedTriangles.push(...translated.triangles);
  }
  
  return {
    name: stl.name,
    triangles: combinedTriangles
  };
}

/**
 * Create a rectangular first layer pattern
 */
export function createRectangularFirstLayer(
  patchStl: ParsedSTL,
  plateWidth: number,
  plateLength: number,
  patchSpacing: number = 5
): ParsedSTL {
  const bbox = getBoundingBox(patchStl);
  const patchWidth = bbox.size.x;
  const patchLength = bbox.size.y;
  
  const countX = Math.floor((plateWidth - patchWidth) / (patchWidth + patchSpacing)) + 1;
  const countY = Math.floor((plateLength - patchLength) / (patchLength + patchSpacing)) + 1;
  
  // Center the pattern on the plate
  const totalWidth = countX * patchWidth + (countX - 1) * patchSpacing;
  const totalLength = countY * patchLength + (countY - 1) * patchSpacing;
  const startX = (plateWidth - totalWidth) / 2;
  const startY = (plateLength - totalLength) / 2;
  
  const centered = centerAtOrigin(patchStl);
  const positioned = translateStl(centered, startX + patchWidth/2, startY + patchLength/2, 0);
  
  return replicateGrid(positioned, countX, countY, patchSpacing, patchSpacing);
}

/**
 * Create a circular first layer pattern
 */
export function createCircularFirstLayer(
  patchStl: ParsedSTL,
  plateRadius: number,
  ringSpacing: number = 10
): ParsedSTL {
  const bounds = getBoundingBox(patchStl);
  const patchSize = Math.max(bounds.size.x, bounds.size.y);
  const centered = centerAtOrigin(patchStl);
  const combinedTriangles: Triangle[] = [];
  
  // Add center patch
  combinedTriangles.push(...centered.triangles);
  
  // Add concentric rings
  let currentRadius = patchSize + ringSpacing;
  
  while (currentRadius + patchSize/2 < plateRadius) {
    const circumference = 2 * Math.PI * currentRadius;
    const patchCount = Math.floor(circumference / (patchSize + ringSpacing));
    
    if (patchCount > 0) {
      const radialPattern = replicateRadial(centered, currentRadius, patchCount, false);
      combinedTriangles.push(...radialPattern.triangles);
    }
    
    currentRadius += patchSize + ringSpacing;
  }
  
  return {
    name: 'CircularFirstLayer',
    triangles: combinedTriangles
  };
}

/**
 * Modify flow calibration cube for different nozzle sizes
 */
export function adjustFlowCubeForNozzle(
  stl: ParsedSTL,
  originalNozzleSize: number,
  targetNozzleSize: number
): ParsedSTL {
  const scaleFactor = targetNozzleSize / originalNozzleSize;
  const bounds = getBoundingBox(stl);
  const centerX = bounds.center.x;
  const centerY = bounds.center.y;
  
  // Scale wall thicknesses while maintaining overall cube size
  return modifyVertices(stl, vertex => {
    // Calculate distance from center in XY plane
    const dx = vertex.x - centerX;
    const dy = vertex.y - centerY;
    
    // Only scale vertices that are part of inner walls
    // Outer walls stay at the same position
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxDistance = Math.max(Math.abs(bounds.size.x), Math.abs(bounds.size.y)) / 2;
    
    // If vertex is on outer edge, don't scale
    if (Math.abs(distance - maxDistance) < 0.1) {
      return vertex;
    }
    
    // Scale inner walls proportionally to nozzle size
    return {
      x: centerX + dx * scaleFactor,
      y: centerY + dy * scaleFactor,
      z: vertex.z
    };
  });
}