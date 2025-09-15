import { useState } from 'react';
import { Zap, Info, Lightbulb, Gauge, Package, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMaxVolumetricTower3MF } from '@/utils/orcaTower3MFExports';

interface MaxVolumetricSpeedProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const MaxVolumetricSpeed: React.FC<MaxVolumetricSpeedProps> = ({ onNavigate }) => {
  const [start, setStart] = useState(15);
  const [measuredHeight, setMeasuredHeight] = useState(16);
  const [step, setStep] = useState(0.5);
  const [result, setResult] = useState<number | null>(null);

  // Tower generation states
  const [material, setMaterial] = useState('PLA');
  const [towerStart, setTowerStart] = useState('10');
  const [towerEnd, setTowerEnd] = useState('40');
  const [towerStep, setTowerStep] = useState('5');
  const [firmware, setFirmware] = useState<'marlin' | 'klipper' | 'rrf' | 'orcaslicer'>('marlin');
  const [includePostProcessing, setIncludePostProcessing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerResult, setTowerResult] = useState<string | null>(null);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);

  const calculate = () => {
    const maxSpeed = start + (measuredHeight * step);
    setResult(maxSpeed);
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseInt(towerStart),
        endValue: parseInt(towerEnd),
        stepSize: parseInt(towerStep),
      };

      const project = await generateMaxVolumetricTower3MF(
        params,
        firmware,
        includePostProcessing
      );

      const url = URL.createObjectURL(project.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = project.filename;
      a.click();
      URL.revokeObjectURL(url);

      const numSections = Math.floor(Math.abs(params.endValue - params.startValue) / params.stepSize) + 1;
      setTowerResult(`✅ Max Volumetric Speed tower generated successfully!\n${numSections} speed sections from ${towerStart} to ${towerEnd} mm³/s\n${includePostProcessing ? 'Post-processing G-code included' : 'Manual setup required'}`);

      setTowerInstructions(`Max Volumetric Speed Tower Setup Instructions:

1. Import the 3MF file into OrcaSlicer
2. Slice with these settings:
   - Layer height: 0.2mm (or your preference)
   - Line width: 0.4mm (or your nozzle size)
   - Infill: 20-30%
${includePostProcessing ?
`3. Post-processing is already configured for ${firmware}
4. Each section will automatically change volumetric speed` :
`3. Manual setup required - add speed changes in slicer`}
5. Print and observe where under-extrusion starts:
   - Look for rough surfaces
   - Missing or thin layers
   - Inconsistent extrusion
6. Measure the height where quality degrades
7. Calculate: Max Speed = Start + (Height × Step)

Material notes for ${material}:
Test at your normal printing temperature.
Higher temperatures allow higher volumetric speeds.`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setTowerResult('❌ Error generating tower. Please try again.');
    } finally {
      setGenerating(false);
    }
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

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculate">Calculate from Test</TabsTrigger>
          <TabsTrigger value="generate">Generate Tower</TabsTrigger>
        </TabsList>

        <TabsContent value="calculate">
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
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Max Volumetric Speed Tower</CardTitle>
              <CardDescription>
                Create a test tower to find your hotend's maximum flow capacity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-material">Material Type</Label>
                  <Select value={material} onValueChange={setMaterial}>
                    <SelectTrigger id="gen-material">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLA">PLA</SelectItem>
                      <SelectItem value="PETG">PETG</SelectItem>
                      <SelectItem value="ABS">ABS</SelectItem>
                      <SelectItem value="TPU">TPU</SelectItem>
                      <SelectItem value="ASA">ASA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="firmware">Firmware Type</Label>
                  <Select value={firmware} onValueChange={(v) => setFirmware(v as any)}>
                    <SelectTrigger id="firmware">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marlin">Marlin</SelectItem>
                      <SelectItem value="klipper">Klipper</SelectItem>
                      <SelectItem value="rrf">RepRapFirmware</SelectItem>
                      <SelectItem value="orcaslicer">OrcaSlicer Native</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tower-start">Start Speed (mm³/s)</Label>
                  <Input
                    id="tower-start"
                    type="number"
                    value={towerStart}
                    onChange={(e) => setTowerStart(e.target.value)}
                    min="5"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tower-end">End Speed (mm³/s)</Label>
                  <Input
                    id="tower-end"
                    type="number"
                    value={towerEnd}
                    onChange={(e) => setTowerEnd(e.target.value)}
                    min="10"
                    max="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tower-step">Step Size (mm³/s)</Label>
                  <Input
                    id="tower-step"
                    type="number"
                    value={towerStep}
                    onChange={(e) => setTowerStep(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="post-processing" className="cursor-pointer">
                  Include Post-Processing G-code
                </Label>
                <Switch
                  id="post-processing"
                  checked={includePostProcessing}
                  onCheckedChange={setIncludePostProcessing}
                />
              </div>

              <Button
                onClick={generateTower}
                className="w-full"
                disabled={generating}
              >
                {generating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Generate 3MF Project
                  </>
                )}
              </Button>

              {towerResult && (
                <Alert className={towerResult.includes('✅') ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                  <AlertDescription className="whitespace-pre-line">
                    {towerResult}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {towerInstructions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Tower Setup Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {towerInstructions}
                </pre>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

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