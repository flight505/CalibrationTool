/**
 * Post-Processing Generator for Calibration Towers
 * Generates firmware-specific G-code commands for OrcaSlicer calibration
 */

import { GeneratedTower, TowerSection, OrcaSlicerSettings } from './orcaTowerGenerator';
import type { FirmwareType } from './firmwareTypes';
import { mapModifierSettingsRecord } from './orcaSettingMapper';

export type { FirmwareType };

export interface CalibrationCommand {
  zHeight: number;
  layerNumber?: number;
  commands: string[];
  description: string;
  sectionIndex: number;
}

export interface PostProcessingOptions {
  firmware: FirmwareType;
  includeLCD: boolean;
  includeComments: boolean;
  baseHeight: number;
  sectionHeight: number;
  initialLayerHeight: number;
  layerHeight: number;
}

export interface LayerInfo {
  zHeight: number;
  layerNumber: number;
  isNewSection: boolean;
  sectionIndex: number;
}

/**
 * Post-processing generator for calibration towers
 */
export class PostProcessingGenerator {
  private options: PostProcessingOptions;

  constructor(options: Partial<PostProcessingOptions> = {}) {
    this.options = {
      firmware: 'marlin',
      includeLCD: true,
      includeComments: true,
      baseHeight: 1.0,
      sectionHeight: 10.0,
      initialLayerHeight: 0.3,
      layerHeight: 0.2,
      ...options
    };
  }

  /**
   * Calculate layer information for each section
   */
  calculateLayerInfo(sections: TowerSection[]): LayerInfo[] {
    const { baseHeight, sectionHeight, initialLayerHeight, layerHeight } = this.options;
    const layerInfo: LayerInfo[] = [];
    
    // Start after the base
    let currentZ = baseHeight;
    let layerNumber = Math.ceil(baseHeight / layerHeight);
    
    sections.forEach((_section, index) => {
      // Calculate the Z height for this section
      const sectionStartZ = baseHeight + (index * sectionHeight);
      
      // Find the first layer that enters this section
      while (currentZ < sectionStartZ && layerNumber === Math.ceil(baseHeight / layerHeight)) {
        currentZ = initialLayerHeight + (layerNumber - 1) * layerHeight;
        layerNumber++;
      }
      
      while (currentZ < sectionStartZ) {
        currentZ += layerHeight;
        layerNumber++;
      }
      
      layerInfo.push({
        zHeight: currentZ,
        layerNumber,
        isNewSection: true,
        sectionIndex: index
      });
    });
    
    return layerInfo;
  }

  /**
   * Generate calibration commands for a tower
   */
  generateCommands(tower: GeneratedTower, calibrationType: string): CalibrationCommand[] {
    const commands: CalibrationCommand[] = [];
    const layerInfo = this.calculateLayerInfo(tower.sections);
    
    tower.sections.forEach((section, index) => {
      const layer = layerInfo[index];
      if (!layer) return;
      
      const sectionCommands = this.generateSectionCommands(
        calibrationType,
        section,
        index
      );
      
      if (sectionCommands.length > 0) {
        commands.push({
          zHeight: layer.zHeight,
          layerNumber: layer.layerNumber,
          commands: sectionCommands,
          description: `Section ${index + 1}: ${section.label}`,
          sectionIndex: index
        });
      }
    });
    
    return commands;
  }

  /**
   * Generate commands for a specific section based on calibration type
   */
  private generateSectionCommands(
    calibrationType: string,
    section: TowerSection,
    sectionIndex: number
  ): string[] {
    const commands: string[] = [];
    const { firmware, includeLCD, includeComments } = this.options;
    
    if (includeComments) {
      commands.push(`; Section ${sectionIndex + 1} - ${section.label}`);
    }
    
    switch (calibrationType) {
      case 'temperature':
        commands.push(...this.generateTemperatureCommands(section.value, firmware));
        break;
      
      case 'fan_speed':
        commands.push(...this.generateFanCommands(section.value, firmware));
        break;
      
      case 'flow_rate':
        commands.push(...this.generateFlowCommands(section.value, firmware));
        break;
      
      case 'pressure_advance':
        commands.push(...this.generatePressureAdvanceCommands(section.value, firmware));
        break;
      
      case 'retraction':
        // Assuming value is retraction distance, could be enhanced with speed
        commands.push(...this.generateRetractionCommands(section.value, 30, firmware));
        break;
      
      case 'max_volumetric_speed':
        // Convert volumetric speed to print speed based on layer height and line width
        const printSpeed = this.calculatePrintSpeed(section.value);
        commands.push(...this.generateSpeedCommands(printSpeed, firmware));
        break;
    }
    
    // Add LCD message if enabled
    if (includeLCD) {
      commands.push(`M117 ${section.label}`);
    }
    
    return commands;
  }

  /**
   * Generate temperature change commands
   */
  private generateTemperatureCommands(temp: number, firmware: FirmwareType): string[] {
    switch (firmware) {
      case 'klipper':
        return [
          `SET_HEATER_TEMPERATURE HEATER=extruder TARGET=${temp}`,
          `TEMPERATURE_WAIT SENSOR=extruder MINIMUM=${temp}`
        ];
      
      case 'rrf':
        return [
          `G10 P0 S${temp} ; Set active temperature`,
          `M116 P0 ; Wait for temperature`
        ];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [
          `M104 S${temp} ; Set hotend temperature`,
          `M109 S${temp} ; Wait for temperature to stabilize`
        ];
    }
  }

  /**
   * Generate fan speed commands
   */
  private generateFanCommands(percent: number, firmware: FirmwareType): string[] {
    const fanValue = Math.round((percent / 100) * 255);
    
    switch (firmware) {
      case 'klipper':
        return [`M106 S${fanValue} ; Set fan to ${percent}%`];
      
      case 'rrf':
        return [`M106 P0 S${percent / 100} ; Set fan to ${percent}%`];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [`M106 S${fanValue} ; Set fan to ${percent}%`];
    }
  }

  /**
   * Generate flow rate commands
   */
  private generateFlowCommands(ratio: number, firmware: FirmwareType): string[] {
    const flowPercent = Math.round(ratio * 100);
    
    switch (firmware) {
      case 'klipper':
        return [`M221 S${flowPercent} ; Set flow to ${flowPercent}%`];
      
      case 'rrf':
        return [`M221 S${flowPercent} ; Set flow to ${flowPercent}%`];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [`M221 S${flowPercent} ; Set flow to ${flowPercent}%`];
    }
  }

  /**
   * Generate pressure advance commands
   */
  private generatePressureAdvanceCommands(value: number, firmware: FirmwareType): string[] {
    switch (firmware) {
      case 'klipper':
        return [`SET_PRESSURE_ADVANCE ADVANCE=${value} ; Set pressure advance`];
      
      case 'rrf':
        return [`M572 D0 S${value} ; Set pressure advance`];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [`M900 K${value} ; Set linear advance`];
    }
  }

  /**
   * Generate retraction commands
   */
  private generateRetractionCommands(distance: number, speed: number, firmware: FirmwareType): string[] {
    const speedMmMin = speed * 60;
    
    switch (firmware) {
      case 'klipper':
        return [
          `SET_RETRACTION RETRACT_LENGTH=${distance} RETRACT_SPEED=${speed} ; Set retraction`
        ];
      
      case 'rrf':
        return [
          `M207 S${distance} F${speedMmMin} ; Set firmware retraction`
        ];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [
          `M207 S${distance} F${speedMmMin} ; Set firmware retraction`
        ];
    }
  }

  /**
   * Generate speed change commands
   */
  private generateSpeedCommands(speed: number, firmware: FirmwareType): string[] {
    const speedPercent = Math.round((speed / 100) * 100); // Assuming base speed of 100mm/s
    
    switch (firmware) {
      case 'klipper':
        return [
          `SET_VELOCITY_LIMIT VELOCITY=${speed} ; Set max velocity`,
          `M220 S${speedPercent} ; Set speed factor`
        ];
      
      case 'rrf':
        return [
          `M203 X${speed * 60} Y${speed * 60} ; Set max feedrate`,
          `M220 S${speedPercent} ; Set speed factor`
        ];
      
      case 'marlin':
      case 'orcaslicer':
      default:
        return [`M220 S${speedPercent} ; Set speed factor to ${speedPercent}%`];
    }
  }

  /**
   * Calculate print speed from volumetric flow rate
   */
  private calculatePrintSpeed(volumetricSpeed: number): number {
    // Assuming 0.2mm layer height and 0.45mm line width as defaults
    const layerHeight = this.options.layerHeight || 0.2;
    const lineWidth = 0.45;
    return volumetricSpeed / (layerHeight * lineWidth);
  }

  /**
   * Generate OrcaSlicer custom_gcode_per_layer.xml content
   */
  generateCustomGcodeXML(commands: CalibrationCommand[]): string {
    let xml = '<?xml version="1.0" encoding="utf-8"?>\n';
    xml += '<custom_gcodes_per_layer>\n';
    xml += '<plate>\n';
    xml += '<plate_info id="1"/>\n';
    
    commands.forEach(cmd => {
      const gcodeString = cmd.commands.join('\n');
      // Escape special XML characters
      const escapedGcode = gcodeString
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
      
      xml += `<layer top_z="${cmd.zHeight.toFixed(2)}" type="4" extruder="0" color="" extra="${escapedGcode}"/>\n`;
    });
    
    xml += '</plate>\n';
    xml += '</custom_gcodes_per_layer>\n';
    
    return xml;
  }

  /**
   * Generate modifier mesh settings for OrcaSlicer
   */
  generateModifierSettings(
    settings: OrcaSlicerSettings,
    firmware: FirmwareType
  ): Record<string, any>[] {
    const modifierConfigs: Record<string, any>[] = [];
    
    settings.modifierSettings.forEach(modifier => {
      const config: Record<string, any> = mapModifierSettingsRecord(
        modifier.settings,
        firmware
      );

      modifierConfigs.push(config);
    });

    return modifierConfigs;
  }
}

/**
 * Convenience function to create a post-processor with default settings
 */
export function createPostProcessor(options?: Partial<PostProcessingOptions>): PostProcessingGenerator {
  return new PostProcessingGenerator(options);
}
