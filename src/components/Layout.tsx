import React from 'react';
import { Printer, Calculator, Thermometer, Move3D, RotateCcw, FileText, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LayoutProps {
  children: React.ReactNode;
  currentTool: string;
  onToolChange: (tool: string) => void;
}

const tools = [
  { id: 'flow', name: 'Flow Calibration', icon: Calculator, description: 'Calibrate flow rate' },
  { id: 'temperature', name: 'Temperature Tower', icon: Thermometer, description: 'Find optimal temperature' },
  { id: 'pressure', name: 'Pressure Advance', icon: Move3D, description: 'Tune pressure advance' },
  { id: 'retraction', name: 'Retraction Test', icon: RotateCcw, description: 'Optimize retraction' },
];

const Layout: React.FC<LayoutProps> = ({ children, currentTool, onToolChange }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Printer className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Orca Slicer Calibration Suite</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                <Github className="w-5 h-5" />
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex gap-2 overflow-x-auto">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Button
                  key={tool.id}
                  variant={currentTool === tool.id ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => onToolChange(tool.id)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <Icon className="w-4 h-4" />
                  {tool.name}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Calibration tools for Orca Slicer</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Documentation</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
              <a href="#" className="hover:text-foreground transition-colors">About</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;