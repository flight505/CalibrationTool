import Decimal from 'decimal.js';
import type { ParsedSTL } from './asciiStlUtils';

/**
 * Represents a calibration section in the STL geometry
 */
export interface STLSection {
  sectionIndex: number;
  minZ: number;
  maxZ: number;
  centerZ: number;
  height: number;
}

/**
 * Complete geometry information extracted from STL
 */
export interface STLGeometryInfo {
  totalHeight: number;
  minZ: number;
  maxZ: number;
  baseHeight: number;
  sections: STLSection[];
  estimatedSectionHeight: number;
}

/**
 * Slice settings provided by user
 */
export interface SliceSettings {
  layerHeight: number;          // Standard layer height (e.g., 0.2mm)
  firstLayerHeight: number;     // First layer height (e.g., 0.3mm)
  nozzleDiameter: number;        // Nozzle diameter (e.g., 0.4mm)
}

/**
 * Layer information with precise Z-height tracking
 */
export interface LayerInfo {
  layerNumber: number;
  zHeight: Decimal;
  sectionIndex: number;
  isNewSection: boolean;
}

/**
 * Analyzes STL geometry to determine actual section positions
 * Based on AutoTowersGenerator's approach of reading actual geometry
 */
export function analyzeSTLGeometry(stl: ParsedSTL): STLGeometryInfo {
  const triangles = stl.triangles;
  const allZCoords: number[] = [];

  // Extract all unique Z-coordinates from vertices
  triangles.forEach((tri: any) => {
    tri.vertices.forEach((v: any) => {
      allZCoords.push(v.z);
    });
  });

  const uniqueZ = [...new Set(allZCoords)].sort((a, b) => a - b);
  const minZ = Math.min(...uniqueZ);
  const maxZ = Math.max(...uniqueZ);
  const totalHeight = maxZ - minZ;

  // Detect sections by analyzing Z-coordinate distribution
  const sections = detectSections(uniqueZ, minZ);

  // Estimate base height (typically the first section or short base)
  const baseHeight = sections.length > 0 ? sections[0].maxZ : 1.0;

  // Calculate average section height (excluding base)
  const sectionHeights = sections.slice(1).map(s => s.height);
  const estimatedSectionHeight = sectionHeights.length > 0
    ? sectionHeights.reduce((a, b) => a + b, 0) / sectionHeights.length
    : 10.0; // Default fallback

  return {
    totalHeight,
    minZ,
    maxZ,
    baseHeight,
    sections,
    estimatedSectionHeight
  };
}

/**
 * Detects section boundaries by finding Z-coordinate gaps
 * Sections are separated by areas with no geometry (gaps > threshold)
 */
function detectSections(sortedZ: number[], minZ: number): STLSection[] {
  const sections: STLSection[] = [];
  const GAP_THRESHOLD = 0.3; // mm - gaps larger than this indicate section boundary

  let currentSectionStart = minZ;
  let currentSectionEnd = minZ;

  for (let i = 1; i < sortedZ.length; i++) {
    const gap = sortedZ[i] - sortedZ[i - 1];

    if (gap > GAP_THRESHOLD) {
      // Found a gap - end current section
      sections.push({
        sectionIndex: sections.length,
        minZ: currentSectionStart,
        maxZ: currentSectionEnd,
        centerZ: (currentSectionStart + currentSectionEnd) / 2,
        height: currentSectionEnd - currentSectionStart
      });

      // Start new section
      currentSectionStart = sortedZ[i];
      currentSectionEnd = sortedZ[i];
    } else {
      // Continue current section
      currentSectionEnd = sortedZ[i];
    }
  }

  // Add final section
  if (currentSectionEnd > currentSectionStart) {
    sections.push({
      sectionIndex: sections.length,
      minZ: currentSectionStart,
      maxZ: currentSectionEnd,
      centerZ: (currentSectionStart + currentSectionEnd) / 2,
      height: currentSectionEnd - currentSectionStart
    });
  }

  return sections;
}

/**
 * Calculates layer Z-heights using Decimal precision
 * Based on AutoTowersGenerator's LayerEnumerate algorithm
 */
export function calculateLayerHeights(
  geometryInfo: STLGeometryInfo,
  sliceSettings: SliceSettings
): LayerInfo[] {
  const layers: LayerInfo[] = [];

  let currentZ = new Decimal(0);
  let layerNumber = 0;
  let sectionIndex = 0;

  const totalHeight = new Decimal(geometryInfo.totalHeight);
  const firstLayer = new Decimal(sliceSettings.firstLayerHeight);
  const standardLayer = new Decimal(sliceSettings.layerHeight);

  // Determine section boundaries from geometry
  let nextSectionStart = geometryInfo.sections.length > 1
    ? new Decimal(geometryInfo.sections[1].minZ)
    : new Decimal(geometryInfo.baseHeight);

  while (currentZ.lessThan(totalHeight)) {
    // Increment height (first layer uses firstLayerHeight)
    if (layerNumber === 0) {
      currentZ = currentZ.plus(firstLayer);
    } else {
      currentZ = currentZ.plus(standardLayer);
    }
    layerNumber++;

    // Check if we've crossed into a new section
    const isNewSection = currentZ.greaterThan(nextSectionStart);

    if (isNewSection && sectionIndex < geometryInfo.sections.length - 1) {
      sectionIndex++;

      // Set next boundary
      if (sectionIndex < geometryInfo.sections.length - 1) {
        nextSectionStart = new Decimal(geometryInfo.sections[sectionIndex + 1].minZ);
      } else {
        nextSectionStart = new Decimal(Infinity); // No more sections
      }
    }

    layers.push({
      layerNumber,
      zHeight: currentZ,
      sectionIndex,
      isNewSection
    });
  }

  return layers;
}

/**
 * Validates that calculated Z-height exists within STL geometry bounds
 */
export function validateZHeight(
  zHeight: number,
  geometryInfo: STLGeometryInfo,
  tolerance: number = 0.1
): boolean {
  return zHeight >= (geometryInfo.minZ - tolerance) &&
         zHeight <= (geometryInfo.maxZ + tolerance);
}

/**
 * Calculates optimal height that aligns to complete layers
 * Based on AutoTowersGenerator's _calculateOptimalHeight
 */
export function calculateOptimalHeight(
  nominalHeight: number,
  layerHeight: number
): number {
  return layerHeight * Math.ceil(nominalHeight / layerHeight);
}

/**
 * Finds the layer number closest to a target Z-height
 */
export function findLayerAtHeight(
  targetZ: number,
  layers: LayerInfo[]
): LayerInfo | null {
  let closest: LayerInfo | null = null;
  let minDiff = Infinity;

  for (const layer of layers) {
    const diff = Math.abs(layer.zHeight.toNumber() - targetZ);
    if (diff < minDiff) {
      minDiff = diff;
      closest = layer;
    }
  }

  return closest;
}

/**
 * Gets all layers that represent section boundaries
 */
export function getSectionBoundaryLayers(layers: LayerInfo[]): LayerInfo[] {
  return layers.filter(layer => layer.isNewSection);
}
