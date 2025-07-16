import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Quick Problem Fixes</h3>
        {selectedProblem && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onProblemSelect(null)}
            className="text-xs h-7 px-2"
          >
            Clear
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2">
        {problemButtons.map((problem) => (
          <button
            key={problem.id}
            onClick={() => onProblemSelect(selectedProblem === problem.id ? null : problem.id)}
            className="rounded-full"
            title={problem.description}
          >
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 px-3 py-1 cursor-pointer transition-all",
                selectedProblem === problem.id 
                  ? "bg-primary/10 text-primary hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30" 
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <problem.Icon className="w-3.5 h-3.5" />
              {problem.label}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}