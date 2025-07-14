import { useState } from 'react';
import { Zap, Info, Lightbulb, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';

interface MaxVolumetricSpeedProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const MaxVolumetricSpeed: React.FC<MaxVolumetricSpeedProps> = ({ onNavigate }) => {
  const [start, setStart] = useState(15);
  const [measuredHeight, setMeasuredHeight] = useState(16);
  const [step, setStep] = useState(0.5);
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const maxSpeed = start + (measuredHeight * step);
    setResult(maxSpeed);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center relative">
          {onNavigate && (
            <div className="absolute right-4 top-4">
              <HelpButton 
                docPath="/docs/orca-slicer/calibration/calibration-guide.md"
                tooltip="View volumetric speed calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Gauge className="w-8 h-8" />
            Maximum Volumetric Speed
          </CardTitle>
          <CardDescription className="text-base">
            Find your hotend's maximum melting capacity
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Speed Calculator</CardTitle>
            <CardDescription>
              Calculate max volumetric speed from test results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start">Start Value (mm³/s)</Label>
              <Input
                id="start"
                type="number"
                step="1"
                value={start}
                onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                placeholder="15"
              />
              <p className="text-sm text-muted-foreground">
                Typical starting point for most hotends
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="measured-height">Measured Height (mm)</Label>
              <Input
                id="measured-height"
                type="number"
                value={measuredHeight}
                onChange={(e) => setMeasuredHeight(parseFloat(e.target.value) || 0)}
                placeholder="16"
              />
              <p className="text-sm text-muted-foreground">
                Height before under-extrusion starts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="step">Step Size (mm³/s per mm)</Label>
              <Input
                id="step"
                type="number"
                step="0.1"
                value={step}
                onChange={(e) => setStep(parseFloat(e.target.value) || 0)}
                placeholder="0.5"
              />
            </div>

            <Button onClick={calculate} className="w-full">
              <Zap className="mr-2 h-4 w-4" />
              Calculate Max Volumetric Speed
            </Button>

            {result !== null && (
              <Alert className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
                <AlertTitle>Maximum Volumetric Speed</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {result.toFixed(2)} mm³/s
                </AlertDescription>
                <p className="text-sm mt-2">
                  Enter in Filament Settings → Advanced → Max Volumetric Speed
                </p>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hotend Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <Alert>
                <Gauge className="h-4 w-4" />
                <AlertTitle className="text-sm">Typical Values</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <div><strong>Standard V6:</strong> 10-15 mm³/s</div>
                  <div><strong>Volcano:</strong> 20-25 mm³/s</div>
                  <div><strong>Dragon HF:</strong> 25-30 mm³/s</div>
                  <div><strong>Rapido HF:</strong> 30-40 mm³/s</div>
                  <div><strong>CHT Nozzle:</strong> +20-30% boost</div>
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-1">Signs of Limit:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Rough surface texture</li>
                  <li>• Thin/missing layers</li>
                  <li>• Clicking/skipping extruder</li>
                  <li>• Inconsistent extrusion</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Temperature Effect:</h4>
                <p className="text-muted-foreground">
                  Higher temps = higher flow capacity<br />
                  +10°C can increase max flow by 10-15%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="understanding">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding Volumetric Speed
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>Why This Matters</AlertTitle>
                <AlertDescription>
                  Maximum volumetric speed prevents the slicer from demanding more plastic flow than your 
                  hotend can melt. This is critical for high-speed printing and prevents under-extrusion 
                  on thick layers or fast infill.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Calculation Formula</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Volume = </strong>Layer Height × Line Width × Speed</p>
                    <p className="text-muted-foreground">Example:</p>
                    <p>0.2mm × 0.4mm × 300mm/s = 24 mm³/s</p>
                    <p className="text-muted-foreground mt-2">
                      Slicer automatically limits speed based on this
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Material Dependencies</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>PLA:</strong> Baseline reference</p>
                    <p><strong>PETG:</strong> ~80% of PLA</p>
                    <p><strong>ABS:</strong> ~90% of PLA</p>
                    <p><strong>TPU:</strong> ~50% of PLA</p>
                    <p><strong>PA-CF:</strong> ~70% of PLA</p>
                    <p className="text-muted-foreground mt-2">
                      Test each material separately
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Safety Margin:</strong> Use 80-90% of your tested maximum for reliable printing. 
                  This accounts for temperature variations and ensures consistent quality across the entire print.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default MaxVolumetricSpeed;