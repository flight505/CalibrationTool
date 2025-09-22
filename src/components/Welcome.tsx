import React from 'react';
import {
  Printer, FlaskConical, BarChart3, Gauge, Target,
  BookOpen, Sparkles, Zap, CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WelcomeProps {
  onNavigateToTool?: (tool: string) => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onNavigateToTool }) => {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Printer className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">OrcaSlicer Calibration Suite</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional 3D printer calibration tools with Design of Experiments (DOE) methodology
          for systematic optimization of print quality and performance.
        </p>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              DOE Methodology
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Use Taguchi orthogonal arrays and Response Surface Methodology to optimize
              multiple parameters simultaneously with minimal test prints.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">L9 Arrays</Badge>
              <Badge variant="secondary">L18 Arrays</Badge>
              <Badge variant="secondary">L27 Arrays</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Comprehensive Testing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              8+ specialized calibration tools covering all critical printer parameters
              from first layer to advanced pressure advance tuning.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Temperature</Badge>
              <Badge variant="secondary">Flow Ratio</Badge>
              <Badge variant="secondary">Retraction</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              OrcaSlicer Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Native 3MF export with embedded modifier meshes, post-processing scripts,
              and automatic G-code generation for all calibration towers.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">3MF Export</Badge>
              <Badge variant="secondary">G-code</Badge>
              <Badge variant="secondary">Modifiers</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                New to Calibration?
              </h3>
              <ol className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <div>
                    <strong>First Layer:</strong> Start with first layer calibration for proper bed adhesion
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <div>
                    <strong>Temperature:</strong> Find optimal printing temperature for your filament
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <div>
                    <strong>Flow Ratio:</strong> Calibrate material flow for accurate dimensions
                  </div>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  <div>
                    <strong>Retraction:</strong> Eliminate stringing with proper retraction settings
                  </div>
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                Advanced Optimization
              </h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-1">DOE Planner</p>
                  <p className="text-muted-foreground">
                    Systematically optimize multiple parameters using statistical design methods.
                    Reduce testing from hundreds to just 9-27 prints.
                  </p>
                </div>
                <div className="p-3 bg-primary/5 rounded-lg">
                  <p className="font-semibold mb-1">Response Surface Analysis</p>
                  <p className="text-muted-foreground">
                    Visualize parameter interactions and find global optimum settings for
                    your specific printer and material combination.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Calibration Workflow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Select Test</p>
                  <p className="text-sm text-muted-foreground">
                    Choose from Quick Tests or use DOE Planner for comprehensive optimization
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold">Generate Model</p>
                  <p className="text-sm text-muted-foreground">
                    Export 3MF project with embedded settings and post-processing scripts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold">Analyze Results</p>
                  <p className="text-sm text-muted-foreground">
                    Use built-in calculators or DOE analysis tools to determine optimal values
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <p className="text-sm text-muted-foreground">
                All calibration tools support Marlin, Klipper, RepRapFirmware, and native OrcaSlicer commands
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center space-y-4">
        <p className="text-lg text-muted-foreground">
          Ready to optimize your 3D printer?
        </p>
        <div className="flex gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => onNavigateToTool?.('doe')}
          >
            <FlaskConical className="mr-2 h-5 w-5" />
            Open DOE Planner
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => onNavigateToTool?.('documentation')}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;