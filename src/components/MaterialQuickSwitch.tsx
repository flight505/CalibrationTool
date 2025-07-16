import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MaterialQuickSwitchProps {
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;
  availableMaterials: string[];
}

const materialInfo: Record<string, { color: string; temp: string }> = {
  'All': { color: 'bg-gray-500', temp: '' },
  'PLA': { color: 'bg-green-500', temp: '190-220°C' },
  'PETG': { color: 'bg-blue-500', temp: '230-250°C' },
  'ABS': { color: 'bg-orange-500', temp: '230-260°C' },
  'ASA': { color: 'bg-red-500', temp: '240-270°C' },
  'TPU': { color: 'bg-purple-500', temp: '230-240°C' },
  'Nylon': { color: 'bg-amber-500', temp: '260-280°C' },
  'PC': { color: 'bg-slate-500', temp: '260-310°C' },
};

export default function MaterialQuickSwitch({ 
  selectedMaterial, 
  onMaterialChange, 
  availableMaterials 
}: MaterialQuickSwitchProps) {
  // Always include 'All' option
  const materials = ['All', ...availableMaterials.filter(m => m !== 'All')];
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-muted-foreground">Material:</span>
      <div className="flex gap-1">
        {materials.map((material) => {
          const info = materialInfo[material] || { color: 'bg-gray-500', temp: '' };
          const isSelected = selectedMaterial === material || (selectedMaterial === 'all' && material === 'All');
          
          return (
            <Button
              key={material}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMaterialChange(material === 'All' ? 'all' : material)}
              className={cn(
                "px-3 py-1 h-8 relative",
                isSelected && "ring-2 ring-primary"
              )}
              title={info.temp ? `${material} - ${info.temp}` : material}
            >
              <span className={cn(
                "absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full",
                info.color
              )} />
              <span className="ml-3">{material}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}