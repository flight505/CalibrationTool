import { ReactNode } from 'react';
import { Calculator, Move3D, RotateCcw, Thermometer } from 'lucide-react';

export interface CommandSuggestion {
  icon: ReactNode;
  label: string;
  description: string;
  prefix: string;
}

export const commandSuggestions: CommandSuggestion[] = [
  {
    icon: <Calculator className="w-4 h-4" />,
    label: 'Flow Calibration',
    description: 'Calibrate flow ratio for accurate extrusion',
    prefix: '/flow',
  },
  {
    icon: <Thermometer className="w-4 h-4" />,
    label: 'Temperature Tower',
    description: 'Find optimal printing temperature',
    prefix: '/temperature',
  },
  {
    icon: <Move3D className="w-4 h-4" />,
    label: 'Pressure Advance',
    description: 'Tune pressure advance for sharp corners',
    prefix: '/pressure',
  },
  {
    icon: <RotateCcw className="w-4 h-4" />,
    label: 'Retraction Test',
    description: 'Eliminate stringing and oozing',
    prefix: '/retraction',
  },
];

export function getQueryForCommand(prefix: string): string {
  switch (prefix) {
    case '/flow':
      return 'How do I calibrate flow ratio in OrcaSlicer? What are the steps?';
    case '/temperature':
      return 'What is the temperature tower calibration process? How do I find the optimal temperature?';
    case '/pressure':
      return 'Explain pressure advance calibration. How do I tune it for sharp corners?';
    case '/retraction':
      return 'How to perform a retraction test to eliminate stringing?';
    default:
      return `${prefix} `;
  }
}
