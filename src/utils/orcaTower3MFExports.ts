/**
 * OrcaSlicer Tower 3MF Export Functions
 * Centralized exports for all tower generators with post-processing support
 */

import { generateTemperatureTower3MF } from './orcaTemperatureTower';
import { generateFanSpeedTower3MF } from './orcaFanSpeedTower';
import { generateFlowRateTower3MF } from './orcaFlowRateTower';
import { generateMaxVolumetricTower3MF } from './orcaMaxVolumetricTower';
import { generatePressureAdvanceTower3MF } from './orcaPressureAdvanceTower';
import { generateRetractionTower3MF } from './orcaRetractionTower';
import type { FirmwareType } from './postProcessingGenerator';

export {
  generateTemperatureTower3MF,
  generateFanSpeedTower3MF,
  generateFlowRateTower3MF,
  generateMaxVolumetricTower3MF,
  generatePressureAdvanceTower3MF,
  generateRetractionTower3MF
};

export type { FirmwareType };

// Re-export the main export function for custom usage
export { exportTowerAs3MF } from './orca3mfExporter';

/**
 * Export all tower types with their respective 3MF export functions
 */
export const towerExports = {
  temperature: generateTemperatureTower3MF,
  fanSpeed: generateFanSpeedTower3MF,
  flowRate: generateFlowRateTower3MF,
  maxVolumetric: generateMaxVolumetricTower3MF,
  pressureAdvance: generatePressureAdvanceTower3MF,
  retraction: generateRetractionTower3MF
};

/**
 * Helper function to generate any tower type as 3MF
 */
export async function generateTower3MF(
  towerType: keyof typeof towerExports,
  params: any,
  firmware: FirmwareType = 'marlin',
  includePostProcessing: boolean = true
) {
  const exportFunction = towerExports[towerType];
  if (!exportFunction) {
    throw new Error(`Unknown tower type: ${towerType}`);
  }
  
  return exportFunction(params, firmware, includePostProcessing);
}