import React from 'react';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HelpButtonProps {
  docPath: string;
  tooltip?: string;
  onNavigate: (tool: string, docPath?: string) => void;
}

export const HelpButton: React.FC<HelpButtonProps> = ({ 
  docPath, 
  tooltip = "View documentation",
  onNavigate 
}) => {
  const handleClick = () => {
    // Navigate to documentation with specific path
    onNavigate('documentation', docPath);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="h-8 w-8"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};