import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ListOrdered, Wrench } from 'lucide-react';

interface CalibrationViewToggleProps {
  viewMode: 'settings' | 'calibration';
  onViewModeChange: (mode: 'settings' | 'calibration') => void;
}

export default function CalibrationViewToggle({ viewMode, onViewModeChange }: CalibrationViewToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">View:</span>
      <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && onViewModeChange(value as 'settings' | 'calibration')}>
        <ToggleGroupItem value="settings" aria-label="View by settings">
          <ListOrdered className="w-4 h-4 mr-2" />
          Settings
        </ToggleGroupItem>
        <ToggleGroupItem value="calibration" aria-label="View by calibration">
          <Wrench className="w-4 h-4 mr-2" />
          Calibration
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}