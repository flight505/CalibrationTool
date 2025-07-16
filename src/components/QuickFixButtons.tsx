import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Network, 
  Flame, 
  Square, 
  Target, 
  Mountain, 
  Wind, 
  Zap, 
  Wrench 
} from 'lucide-react';

interface QuickFixButtonsProps {
  selectedProblem: string | null;
  onProblemSelect: (problem: string | null) => void;
}

const problemButtons = [
  { id: 'stringing', label: 'Stringing', Icon: Network, description: 'Filament strings between parts' },
  { id: 'warping', label: 'Warping', Icon: Flame, description: 'Corners lifting from bed' },
  { id: 'corners', label: 'Poor Corners', Icon: Square, description: 'Bulging or gaps at corners' },
  { id: 'adhesion', label: 'Bad First Layer', Icon: Target, description: 'Print not sticking to bed' },
  { id: 'quality', label: 'Poor Overhangs', Icon: Mountain, description: 'Sagging overhangs and bridges' },
  { id: 'surface', label: 'Surface Quality', Icon: Wind, description: 'Rough or poor surface finish' },
  { id: 'speed', label: 'Too Slow', Icon: Zap, description: 'Print taking too long' },
  { id: 'accuracy', label: 'Dimensional Issues', Icon: Wrench, description: 'Parts not fitting correctly' },
];

export default function QuickFixButtons({ selectedProblem, onProblemSelect }: QuickFixButtonsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Quick Problem Fixes</h3>
        {selectedProblem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onProblemSelect(null)}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {problemButtons.map((problem) => (
          <Button
            key={problem.id}
            variant={selectedProblem === problem.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onProblemSelect(selectedProblem === problem.id ? null : problem.id)}
            className={cn(
              "h-auto py-3 px-3 flex flex-col items-center gap-1 text-center whitespace-normal",
              selectedProblem === problem.id && "ring-2 ring-primary"
            )}
            title={problem.description}
          >
            <problem.Icon className="w-5 h-5" />
            <span className="text-xs font-medium">{problem.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}