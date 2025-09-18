const { mkdirSync, writeFileSync } = require('fs');
const { join } = require('path');

const OUTPUT_DIR = join('public', 'templates', 'doe');

function ensureOutputDir() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

function createBox(minX, maxX, minY, maxY, minZ, maxZ) {
  const v = [
    { x: minX, y: minY, z: minZ },
    { x: maxX, y: minY, z: minZ },
    { x: maxX, y: maxY, z: minZ },
    { x: minX, y: maxY, z: minZ },
    { x: minX, y: minY, z: maxZ },
    { x: maxX, y: minY, z: maxZ },
    { x: maxX, y: maxY, z: maxZ },
    { x: minX, y: maxY, z: maxZ }
  ];

  return [
    { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[1], v[2]] },
    { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[2], v[3]] },
    { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[6], v[5]] },
    { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[7], v[6]] },
    { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[4], v[5]] },
    { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[5], v[1]] },
    { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[6], v[7]] },
    { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[7], v[3]] },
    { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[3], v[7]] },
    { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[7], v[4]] },
    { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[5], v[6]] },
    { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[6], v[2]] }
  ];
}

function pushBox(triangles, x, y, z, width, depth, height) {
  triangles.push(...createBox(x, x + width, y, y + depth, z, z + height));
}

function trianglesToAscii(name, triangles) {
  let output = `solid ${name}\n`;
  for (const tri of triangles) {
    output += ` facet normal ${tri.normal.x} ${tri.normal.y} ${tri.normal.z}\n`;
    output += '  outer loop\n';
    tri.vertices.forEach(v => {
      output += `   vertex ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}\n`;
    });
    output += '  endloop\n';
    output += ' endfacet\n';
  }
  output += `endsolid ${name}\n`;
  return output;
}

function writeModel(name, triangles) {
  const ascii = trianglesToAscii(name, triangles);
  const filename = join(OUTPUT_DIR, `${name}.stl`);
  writeFileSync(filename, ascii, 'utf8');
  console.log(`Generated ${filename} (${triangles.length} triangles)`);
}

function createCalibrationCube() {
  const triangles = [];
  pushBox(triangles, 0, 0, 0, 20, 20, 20);
  return triangles;
}

function createBridgeArray() {
  const triangles = [];
  const baseThickness = 2;
  const baseWidth = 150;
  const baseDepth = 60;
  pushBox(triangles, 0, 0, 0, baseWidth, baseDepth, baseThickness);

  const spans = [10, 15, 20, 25, 30];
  const laneGap = 6; // clearance between lanes
  const laneDepth = 12;
  const pillarWidth = 8;
  const pillarDepth = 6;
  const pillarHeight = 25;
  const bridgeThickness = 1.2;
  const leftMargin = 18;
  const frontMargin = 10;

  spans.forEach((span, index) => {
    const laneY = frontMargin + index * (laneDepth + laneGap);
    const laneXStart = leftMargin;
    const laneXEnd = laneXStart + pillarWidth * 2 + span;

    // Left pillar
    pushBox(
      triangles,
      laneXStart,
      laneY,
      baseThickness,
      pillarWidth,
      pillarDepth,
      pillarHeight
    );

    // Right pillar
    const rightPillarX = laneXStart + pillarWidth + span;
    pushBox(
      triangles,
      rightPillarX,
      laneY,
      baseThickness,
      pillarWidth,
      pillarDepth,
      pillarHeight
    );

    // Bridge element sitting on top of pillars spanning the gap only
    pushBox(
      triangles,
      laneXStart + pillarWidth,
      laneY,
      baseThickness + pillarHeight,
      span,
      pillarDepth,
      bridgeThickness
    );

    // Add a number tag on the base in front of each lane for identification
    const tagHeight = 1.2;
    const tagDepth = 3;
    pushBox(
      triangles,
      laneXStart,
      laneY - tagDepth - 1,
      baseThickness,
      laneXEnd - laneXStart,
      tagDepth,
      tagHeight
    );
  });

  return triangles;
}

function createOverhangTest() {
  const triangles = [];
  const baseThickness = 2;
  pushBox(triangles, 0, 0, 0, 100, 40, baseThickness);

  const supportWidth = 18;
  const supportHeight = 35;
  pushBox(triangles, 10, 5, baseThickness, supportWidth, 30, supportHeight);

  const stages = [
    { height: 6, extension: 6 },
    { height: 12, extension: 12 },
    { height: 18, extension: 18 },
    { height: 24, extension: 24 },
    { height: 30, extension: 30 }
  ];

  const plateThickness = 1.4;
  const plateWidth = 30;
  const plateDepth = 6;
  const startX = 10 + supportWidth - plateThickness;

  stages.forEach((stage, index) => {
    const z = baseThickness + stage.height;
    const extension = stage.extension;
    const x = startX + extension;
    const y = 8 + index * (plateDepth + 2);

    pushBox(triangles, x, y, z, plateWidth, plateDepth, plateThickness);
    pushBox(triangles, x + plateWidth - 2, y, z, 2, plateDepth, plateThickness + 1);
  });

  return triangles;
}

function createClearanceTest() {
  const triangles = [];
  pushBox(triangles, 0, 0, 0, 120, 60, 3);

  const wallWidth = 6;
  const wallHeight = 20;
  const laneDepth = 10;
  const gaps = [0.2, 0.3, 0.4, 0.5, 0.6];
  const startX = 10;
  const laneSpacing = 12;
  const wallThickness = wallWidth;

  gaps.forEach((gap, index) => {
    const x = startX + index * (wallThickness * 2 + laneSpacing + gap * 10);
    const y = 10;

    const leftWidth = wallThickness;
    const rightWidth = wallThickness;
    const actualGap = gap * 10;

    pushBox(triangles, x, y, 3, leftWidth, laneDepth, wallHeight);
    pushBox(triangles, x + leftWidth + actualGap, y, 3, rightWidth, laneDepth, wallHeight);

    pushBox(triangles, x - 2, y + laneDepth, 3 + wallHeight, leftWidth + actualGap + rightWidth + 4, 2, 1.5);
  });

  return triangles;
}

function createSurfaceQualityPatch() {
  const triangles = [];
  const baseThickness = 2;
  const width = 120;
  const depth = 100;
  pushBox(triangles, 0, 0, 0, width, depth, baseThickness);

  const patchZones = [
    { x: 10, y: 10, w: 40, d: 40, h: 0.8 },
    { x: 60, y: 10, w: 40, d: 40, h: 1.2 },
    { x: 10, y: 60, w: 40, d: 30, h: 0.6 },
    { x: 60, y: 60, w: 40, d: 30, h: 1.0 }
  ];

  patchZones.forEach(zone => {
    pushBox(triangles, zone.x, zone.y, baseThickness, zone.w, zone.d, zone.h);
  });

  const ridgeWidth = 3;
  for (let i = 0; i < 5; i++) {
    const height = 0.5 + i * 0.2;
    const startX = 15 + i * 15;
    pushBox(triangles, startX, 60, baseThickness, ridgeWidth, 35, height);
  }

  for (let i = 0; i < 7; i++) {
    const offset = i * 5;
    pushBox(triangles, 60 + offset, 15 + offset, baseThickness, 5, 5, 3);
  }

  const towerSize = 12;
  const padSpacing = 4;
  const padPositions = [
    { x: width - towerSize - padSpacing, y: 10 },
    { x: width - towerSize - padSpacing, y: 30 },
    { x: width - towerSize - padSpacing, y: 50 },
    { x: width - towerSize - padSpacing, y: 70 }
  ];

  padPositions.forEach((pos, index) => {
    const factor = index + 1;
    pushBox(triangles, pos.x, pos.y, baseThickness, towerSize, towerSize, 2 + factor);
  });

  return triangles;
}

function main() {
  ensureOutputDir();
  writeModel('calibration_cube', createCalibrationCube());
  writeModel('bridge_array', createBridgeArray());
  writeModel('overhang_test', createOverhangTest());
  writeModel('clearance_test', createClearanceTest());
  writeModel('surface_quality_patch', createSurfaceQualityPatch());
}

main();
