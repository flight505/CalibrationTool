import type { FirmwareType } from './firmwareTypes';
import type { OrcaSlicerSettings } from './orcaTowerGenerator';

type FirmwareKey = FirmwareType | 'default';

type KeyMapping = Partial<Record<FirmwareKey, string | string[]>>;

const GENERIC_KEY_MAP: Record<string, KeyMapping> = {
  nozzle_temperature: { default: 'temperature' },
  nozzle_temperature_initial_layer: { default: 'temperature_initial_layer' },
  fan_speed: { default: 'fan_always_on' },
  flow_ratio: { default: 'filament_flow_ratio' },
  bridge_flow_ratio: { default: 'bridge_flow_ratio' },
  top_surface_flow_ratio: { default: 'top_surface_flow_ratio' },
  internal_solid_infill_flow_ratio: { default: 'internal_solid_infill_flow_ratio' },
  pressure_advance: { default: 'pressure_advance' },
  linear_advance: { default: 'linear_advance' },
  pa_value: { default: 'pa_value' },
  retract_length: { default: 'retraction_length' },
  retract_speed: { default: 'retraction_speed' },
  print_speed: { default: 'speed_print' },
  max_volumetric_speed: { default: 'filament_max_volumetric_speed' }
};

const toArray = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

export function resolveOrcaSettingKeys(key: string, firmware: FirmwareType): string[] {
  const mapping = GENERIC_KEY_MAP[key];
  if (!mapping) {
    return [key];
  }

  const firmwareSpecific = toArray(mapping[firmware]);
  const defaults = toArray(mapping.default);
  const resolved = [...firmwareSpecific, ...defaults];

  if (resolved.length === 0) {
    return [key];
  }

  return Array.from(new Set(resolved));
}

export function mapModifierSettingsRecord(
  settings: Record<string, any>,
  firmware: FirmwareType
): Record<string, any> {
  const result: Record<string, any> = {};

  Object.entries(settings || {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }

    const mappedKeys = resolveOrcaSettingKeys(key, firmware);
    mappedKeys.forEach(mappedKey => {
      result[mappedKey] = value;
    });
  });

  return result;
}

export function mapOrcaSettingsForFirmware(
  settings: OrcaSlicerSettings,
  firmware: FirmwareType
): OrcaSlicerSettings {
  return {
    ...settings,
    modifierSettings: settings.modifierSettings.map(modifier => ({
      ...modifier,
      settings: mapModifierSettingsRecord(modifier.settings, firmware)
    }))
  };
}
