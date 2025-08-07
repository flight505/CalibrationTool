#!/usr/bin/env tsx
/**
 * Script to convert OrcaSlicer binary STL files to ASCII format
 * Usage: tsx scripts/convert-stl-templates.ts
 */

import fs from 'fs/promises';
import path from 'path';
import { parseBinarySTL, trianglesToASCII } from '../src/utils/stlConverter';

const STL_CONVERSIONS = [
  // OrcaSlicer STL files
  {
    source: 'OrcaSlicer-main/resources/calib/temperature_tower/temperature_tower.stl',
    target: 'public/templates/temperature_tower_ascii.stl',
    name: 'TemperatureTower'
  },
  {
    source: 'OrcaSlicer-main/resources/calib/pressure_advance/pressure_advance_test.stl',
    target: 'public/templates/pa_pattern_ascii.stl',
    name: 'PressureAdvancePattern'
  },
  {
    source: 'OrcaSlicer-main/resources/calib/pressure_advance/tower_with_seam.stl',
    target: 'public/templates/pa_tower_with_seam_ascii.stl',
    name: 'PATowerWithSeam'
  },
  {
    source: 'OrcaSlicer-main/resources/calib/retraction/retraction_tower.stl',
    target: 'public/templates/retraction_tower_orca_ascii.stl',
    name: 'RetractionTower'
  },
  {
    source: 'OrcaSlicer-main/resources/calib/vfa/VFA.stl',
    target: 'public/templates/vfa_tower_ascii.stl',
    name: 'VFATower'
  },
  // AutoTowersGenerator STL files
  {
    source: 'AutoTowersGenerator/Resources/STL/Fan Tower - Fan 0-100.stl',
    target: 'public/templates/fan_tower_ascii.stl',
    name: 'FanSpeedTower'
  },
  {
    source: 'AutoTowersGenerator/Resources/STL/Flow Tower - Flow 115-85.stl',
    target: 'public/templates/flow_tower_ascii.stl',
    name: 'FlowRateTower'
  },
  {
    source: 'AutoTowersGenerator/Resources/STL/Flow Tower Spiral - Flow 115-85.stl',
    target: 'public/templates/flow_tower_spiral_ascii.stl',
    name: 'FlowRateTowerSpiral'
  },
  {
    source: 'AutoTowersGenerator/Resources/STL/Speed Tower - Print Speed 100-200.stl',
    target: 'public/templates/speed_tower_ascii.stl',
    name: 'SpeedTower'
  }
];

async function convertSTLFile(source: string, target: string, name: string) {
  try {
    console.log(`Converting ${source}...`);
    
    // Read binary STL file
    const buffer = await fs.readFile(source);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    
    // Check if it's ASCII or binary
    const header = buffer.toString('utf8', 0, 5);
    let asciiContent: string;
    
    if (header === 'solid') {
      // Already ASCII
      console.log(`  ${source} is already ASCII format`);
      asciiContent = buffer.toString('utf8');
    } else {
      // Convert binary to ASCII
      const triangles = parseBinarySTL(arrayBuffer);
      console.log(`  Parsed ${triangles.length} triangles`);
      asciiContent = trianglesToASCII(triangles, name);
    }
    
    // Ensure target directory exists
    const targetDir = path.dirname(target);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Write ASCII STL file
    await fs.writeFile(target, asciiContent, 'utf8');
    console.log(`  ✓ Saved to ${target}`);
    
    // Log file size
    const stats = await fs.stat(target);
    console.log(`  File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    return true;
  } catch (error) {
    console.error(`  ✗ Error converting ${source}:`, error);
    return false;
  }
}

async function main() {
  console.log('STL Template Conversion Script');
  console.log('==============================\n');
  
  let successCount = 0;
  let failCount = 0;
  
  for (const conversion of STL_CONVERSIONS) {
    const success = await convertSTLFile(
      conversion.source,
      conversion.target,
      conversion.name
    );
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    console.log('');
  }
  
  console.log('==============================');
  console.log(`Conversion complete: ${successCount} succeeded, ${failCount} failed`);
  
  if (failCount > 0) {
    console.log('\nNote: Some files may not exist. You can download them from:');
    console.log('- OrcaSlicer GitHub: https://github.com/SoftFever/OrcaSlicer/tree/main/resources/calib');
    console.log('- AutoTowersGenerator: https://github.com/kartchnb/AutoTowersGenerator/tree/main/Resources/STL');
  }
}

main().catch(console.error);