/**
 * Shared Slice Settings Input Component
 * Used across all tower generators for consistent user input
 */

import { Card } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Info } from 'lucide-react';
import { SliceSettings } from '../utils/stlGeometryAnalyzer';

interface SliceSettingsInputProps {
  settings: SliceSettings;
  onChange: (settings: SliceSettings) => void;
  showNozzle?: boolean;
}

export function SliceSettingsInput({ settings, onChange, showNozzle = true }: SliceSettingsInputProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold">Slice Settings</h3>
        <div className="group relative">
          <Info className="w-4 h-4 text-muted-foreground cursor-help" />
          <div className="absolute left-0 top-6 w-64 p-3 bg-popover text-popover-foreground text-xs rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 border">
            <p className="font-semibold mb-1">Match your slicer settings</p>
            <p>These values must match what you use in OrcaSlicer to ensure G-code is injected at the correct layers.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="layerHeight" className="text-sm">
            Layer Height (mm)
          </Label>
          <Input
            id="layerHeight"
            type="number"
            step="0.01"
            min="0.05"
            max="0.6"
            value={settings.layerHeight}
            onChange={(e) =>
              onChange({
                ...settings,
                layerHeight: parseFloat(e.target.value) || 0.2
              })
            }
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Standard: 0.2mm, Fine: 0.1mm
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="firstLayerHeight" className="text-sm">
            First Layer Height (mm)
          </Label>
          <Input
            id="firstLayerHeight"
            type="number"
            step="0.01"
            min="0.1"
            max="0.6"
            value={settings.firstLayerHeight}
            onChange={(e) =>
              onChange({
                ...settings,
                firstLayerHeight: parseFloat(e.target.value) || 0.3
              })
            }
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Usually 0.2-0.3mm
          </p>
        </div>

        {showNozzle && (
          <div className="space-y-2">
            <Label htmlFor="nozzleDiameter" className="text-sm">
              Nozzle Diameter (mm)
            </Label>
            <Input
              id="nozzleDiameter"
              type="number"
              step="0.1"
              min="0.2"
              max="1.2"
              value={settings.nozzleDiameter}
              onChange={(e) =>
                onChange({
                  ...settings,
                  nozzleDiameter: parseFloat(e.target.value) || 0.4
                })
              }
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Standard: 0.4mm
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
