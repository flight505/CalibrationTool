import { useState } from 'react';
import { Droplets, Info, Package, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';
import { Switch } from '@/components/ui/switch';
import { generateFlowRateTower3MF } from '@/utils/orcaTower3MFExports';

interface FlowRateTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FlowRateTower: React.FC<FlowRateTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [startFlow, setStartFlow] = useState('0.85');
  const [endFlow, setEndFlow] = useState('1.15');
  const [flowStep, setFlowStep] = useState('0.05');
  const [firmware, setFirmware] = useState<'marlin' | 'klipper' | 'rrf' | 'orcaslicer'>('marlin');
  const [includePostProcessing, setIncludePostProcessing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);

  const materialSettings = {
    PLA: { typical: '1.00', range: '0.90-1.10', description: 'PLA usually needs minimal adjustment' },
    PETG: { typical: '0.95', range: '0.85-1.05', description: 'PETG often needs slight reduction to prevent over-extrusion' },
    ABS: { typical: '1.00', range: '0.90-1.10', description: 'ABS similar to PLA' },
    TPU: { typical: '1.05', range: '0.95-1.15', description: 'TPU may need slight increase due to compression' },
    ASA: { typical: '1.00', range: '0.90-1.10', description: 'ASA similar to ABS' },
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    // Set appropriate defaults based on material
    if (newMaterial === 'PETG') {
      setStartFlow('0.85');
      setEndFlow('1.05');
    } else if (newMaterial === 'TPU') {
      setStartFlow('0.95');
      setEndFlow('1.15');
    } else {
      setStartFlow('0.85');
      setEndFlow('1.15');
    }
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseFloat(startFlow),
        endValue: parseFloat(endFlow),
        stepSize: parseFloat(flowStep),
      };

      const project = await generateFlowRateTower3MF(
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
      setResult(`✅ Flow Rate tower generated successfully!\n${numSections} flow ratio sections from ${startFlow} to ${endFlow}\n${includePostProcessing ? 'Post-processing G-code included' : 'Manual setup required'}`);

      setTowerInstructions(`Flow Rate Tower Setup Instructions:

1. Import the 3MF file into OrcaSlicer
2. Slice with your normal settings
${includePostProcessing ?
`3. Post-processing is already configured for ${firmware}
4. Each section will automatically change flow ratio` :
`3. Add manual flow ratio changes in OrcaSlicer:
   - Go to "Height range modifier"
   - Add modifier for each section height
   - Set flow ratio for each section`}
5. Print and examine each section for:
   - Wall smoothness (no gaps or overlaps)
   - Top surface quality
   - Dimensional accuracy
   - Corner sharpness

How to measure results:
1. Look for the section with:
   - No gaps between wall lines
   - No over-extrusion (rough surface)
   - Smooth, consistent walls
2. Note the flow ratio value for that section
3. Apply this value in OrcaSlicer:
   Material settings → Filament → Flow ratio

Material-specific notes for ${material}:
${materialSettings[material as keyof typeof materialSettings].description}
Typical value: ${materialSettings[material as keyof typeof materialSettings].typical}`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setResult('❌ Error generating tower. Please try again.');
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
                docPath="/docs/orca-slicer/calibration/flow-rate-calibration.md"
                tooltip="View flow rate calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Droplets className="w-8 h-8" />
            Flow Rate Tower
          </CardTitle>
          <CardDescription className="text-base">
            Calibrate material flow ratio for perfect extrusion
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Flow Rate Tower</CardTitle>
          <CardDescription>
            Create a tower to test different flow ratios and find the optimal value
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Important: Flow Ratio Format</AlertTitle>
            <AlertDescription>
              OrcaSlicer uses decimal format (1.00 = 100%). The tower will test variations
              to find your optimal flow ratio. Apply the result in:
              <strong className="block mt-1">Material settings → Filament → Flow ratio</strong>
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material">Material Type</Label>
              <Select value={material} onValueChange={handleMaterialChange}>
                <SelectTrigger id="material">
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
              <p className="text-sm text-muted-foreground">
                Typical: {materialSettings[material as keyof typeof materialSettings].typical} |
                Range: {materialSettings[material as keyof typeof materialSettings].range}
              </p>
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
              <Label htmlFor="start-flow">Start Flow Ratio</Label>
              <Input
                id="start-flow"
                type="number"
                value={startFlow}
                onChange={(e) => setStartFlow(e.target.value)}
                min="0.50"
                max="1.50"
                step="0.01"
                placeholder="0.85"
              />
              <p className="text-xs text-muted-foreground">
                Decimal format (0.85 = 85%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-flow">End Flow Ratio</Label>
              <Input
                id="end-flow"
                type="number"
                value={endFlow}
                onChange={(e) => setEndFlow(e.target.value)}
                min="0.50"
                max="1.50"
                step="0.01"
                placeholder="1.15"
              />
              <p className="text-xs text-muted-foreground">
                Decimal format (1.15 = 115%)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flow-step">Step Size</Label>
              <Input
                id="flow-step"
                type="number"
                value={flowStep}
                onChange={(e) => setFlowStep(e.target.value)}
                min="0.01"
                max="0.10"
                step="0.01"
                placeholder="0.05"
              />
              <p className="text-xs text-muted-foreground">
                Decimal format (0.05 = 5%)
              </p>
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

          {result && (
            <Alert className={result.includes('✅') ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
              <AlertDescription className="whitespace-pre-line">
                {result}
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

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="instructions">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding Flow Rate Calibration
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Under-Extrusion (Flow Too Low)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1">
                      <li>• Gaps between wall lines</li>
                      <li>• Weak layer adhesion</li>
                      <li>• Rough top surfaces</li>
                      <li>• Missing infill connections</li>
                      <li>• Transparent walls</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Over-Extrusion (Flow Too High)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1">
                      <li>• Rough, wavy surfaces</li>
                      <li>• Blobs and zits</li>
                      <li>• Dimensional inaccuracy</li>
                      <li>• Nozzle dragging on print</li>
                      <li>• Elephant's foot on first layer</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTitle>Calibration Order</AlertTitle>
                <AlertDescription>
                  Flow rate should be calibrated AFTER:
                  <ol className="mt-2 space-y-1">
                    <li>1. E-steps calibration (extruder motor steps)</li>
                    <li>2. Temperature calibration</li>
                    <li>3. First layer calibration</li>
                  </ol>
                  This ensures your baseline extrusion is correct before fine-tuning flow.
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Visual Inspection Guide</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <p><strong>Perfect Flow:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• Walls are smooth with no visible gaps</li>
                    <li>• Top surface is flat and consistent</li>
                    <li>• Corners are sharp and well-defined</li>
                    <li>• Dimensions match the design</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FlowRateTower;