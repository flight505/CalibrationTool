import { useState } from 'react';
import { Wind, Info, Package, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';
import { Switch } from '@/components/ui/switch';
import { generateFanSpeedTower3MF } from '@/utils/orcaTower3MFExports';

interface FanSpeedTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FanSpeedTower: React.FC<FanSpeedTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [startFan, setStartFan] = useState('0');
  const [endFan, setEndFan] = useState('100');
  const [fanStep, setFanStep] = useState('20');
  const [firmware, setFirmware] = useState<'marlin' | 'klipper' | 'rrf' | 'orcaslicer'>('marlin');
  const [includePostProcessing, setIncludePostProcessing] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);

  const materialSettings = {
    PLA: { recommended: '100', min: '60', description: 'PLA typically needs good cooling' },
    PETG: { recommended: '50', min: '30', description: 'PETG needs moderate cooling to prevent stringing' },
    ABS: { recommended: '0-30', min: '0', description: 'ABS needs minimal cooling to prevent warping' },
    TPU: { recommended: '0-50', min: '0', description: 'TPU flexible materials need light cooling' },
    ASA: { recommended: '0-30', min: '0', description: 'ASA similar to ABS, minimal cooling' },
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    // Set appropriate defaults based on material
    if (newMaterial === 'ABS' || newMaterial === 'ASA') {
      setStartFan('0');
      setEndFan('50');
      setFanStep('10');
    } else if (newMaterial === 'PETG' || newMaterial === 'TPU') {
      setStartFan('0');
      setEndFan('80');
      setFanStep('20');
    } else {
      setStartFan('0');
      setEndFan('100');
      setFanStep('20');
    }
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseInt(startFan),
        endValue: parseInt(endFan),
        stepSize: parseInt(fanStep),
      };

      const project = await generateFanSpeedTower3MF(
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
      setResult(`✅ Fan Speed tower generated successfully!\n${numSections} fan speed sections from ${startFan}% to ${endFan}%\n${includePostProcessing ? 'Post-processing G-code included' : 'Manual setup required'}`);

      setTowerInstructions(`Fan Speed Tower Setup Instructions:

1. Import the 3MF file into OrcaSlicer
2. Slice with your normal settings
${includePostProcessing ?
`3. Post-processing is already configured for ${firmware}
4. Each section will automatically change fan speed` :
`3. Add manual fan speed changes in OrcaSlicer:
   - Go to "Height range modifier"
   - Add modifier for each section height
   - Set fan speed percentage for each section`}
5. Print and observe:
   - Bridging quality
   - Overhang performance
   - Layer adhesion
   - Stringing between towers

Material-specific notes for ${material}:
${materialSettings[material as keyof typeof materialSettings].description}`);
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
                docPath="/docs/orca-slicer/calibration/fan-speed-calibration.md"
                tooltip="View fan speed calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Wind className="w-8 h-8" />
            Fan Speed Tower
          </CardTitle>
          <CardDescription className="text-base">
            Optimize cooling fan speed for best print quality
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Fan Speed Tower</CardTitle>
          <CardDescription>
            Create a calibration tower to test different fan speeds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                Recommended: {materialSettings[material as keyof typeof materialSettings].recommended}%
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
              <Label htmlFor="start-fan">Start Fan Speed (%)</Label>
              <Input
                id="start-fan"
                type="number"
                value={startFan}
                onChange={(e) => setStartFan(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-fan">End Fan Speed (%)</Label>
              <Input
                id="end-fan"
                type="number"
                value={endFan}
                onChange={(e) => setEndFan(e.target.value)}
                min="0"
                max="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fan-step">Step Size (%)</Label>
              <Input
                id="fan-step"
                type="number"
                value={fanStep}
                onChange={(e) => setFanStep(e.target.value)}
                min="5"
                max="50"
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
              How Fan Speed Affects Print Quality
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Too Much Cooling</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1">
                      <li>• Poor layer adhesion</li>
                      <li>• Warping (especially ABS/ASA)</li>
                      <li>• Weak parts that break easily</li>
                      <li>• Rough surface texture</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Too Little Cooling</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <ul className="space-y-1">
                      <li>• Poor bridging performance</li>
                      <li>• Drooping overhangs</li>
                      <li>• Stringing and oozing</li>
                      <li>• Loss of fine details</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertTitle>First Layer Tip</AlertTitle>
                <AlertDescription>
                  Always keep fan OFF for the first layer to ensure good bed adhesion.
                  OrcaSlicer has a setting "No fan for the first X layers" - typically set to 1-3 layers.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default FanSpeedTower;