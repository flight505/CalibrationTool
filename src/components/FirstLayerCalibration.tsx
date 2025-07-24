import { useState } from 'react';
import { Layers, Info, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';

interface FirstLayerCalibrationProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FirstLayerCalibration: React.FC<FirstLayerCalibrationProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [currentZOffset, setCurrentZOffset] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [bedTemp, setBedTemp] = useState('60');
  const [nozzleTemp, setNozzleTemp] = useState('210');
  const [result, setResult] = useState<string | null>(null);

  const materialSettings = {
    PLA: { bedTemp: 60, nozzleTemp: 210, squish: 'moderate' },
    PETG: { bedTemp: 80, nozzleTemp: 240, squish: 'light' },
    ABS: { bedTemp: 100, nozzleTemp: 255, squish: 'moderate' },
    TPU: { bedTemp: 50, nozzleTemp: 225, squish: 'heavy' },
    'PA-CF': { bedTemp: 100, nozzleTemp: 300, squish: 'light' },
  };

  const calculateNewOffset = () => {
    const current = parseFloat(currentZOffset) || 0;
    const adj = parseFloat(adjustment) || 0;
    const newOffset = current + adj;
    
    setResult(`New Z-Offset: ${newOffset.toFixed(3)}mm
    
Remember to save this value in your printer settings!`);
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    const settings = materialSettings[newMaterial as keyof typeof materialSettings];
    setBedTemp(settings.bedTemp.toString());
    setNozzleTemp(settings.nozzleTemp.toString());
  };

  const downloadSTL = () => {
    const link = document.createElement('a');
    link.href = '/templates/first_layer_calibration.stl';
    link.download = 'First_Layer_Calibration.stl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center relative">
          {onNavigate && (
            <div className="absolute right-4 top-4">
              <HelpButton 
                docPath="/docs/orca-slicer/calibration/first-layer-calibration.md"
                tooltip="View first layer calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Layers className="w-8 h-8" />
            First Layer Calibration
          </CardTitle>
          <CardDescription className="text-base">
            Get perfect bed adhesion in less than 5 minutes
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
        <Info className="h-4 w-4" />
        <AlertTitle>Why Start Here?</AlertTitle>
        <AlertDescription>
          First layer calibration is the foundation of successful 3D printing. Without proper bed adhesion, 
          no other calibration matters. This quick test ensures your prints stick well without being too squished.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Setup</CardTitle>
            <CardDescription>
              Configure your first layer test parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <SelectItem value="PA-CF">PA-CF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bed-temp">Bed Temp (°C)</Label>
                <Input
                  id="bed-temp"
                  type="number"
                  value={bedTemp}
                  onChange={(e) => setBedTemp(e.target.value)}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nozzle-temp">Nozzle Temp (°C)</Label>
                <Input
                  id="nozzle-temp"
                  type="number"
                  value={nozzleTemp}
                  onChange={(e) => setNozzleTemp(e.target.value)}
                  placeholder="210"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={downloadSTL} className="w-full" variant="default">
                <Download className="w-4 h-4 mr-2" />
                Download Test STL
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Single layer test pattern (20MB)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Z-Offset Calculator</CardTitle>
            <CardDescription>
              Calculate your new Z-offset based on test results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-offset">Current Z-Offset (mm)</Label>
              <Input
                id="current-offset"
                type="number"
                step="0.01"
                value={currentZOffset}
                onChange={(e) => setCurrentZOffset(e.target.value)}
                placeholder="-1.25"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustment">Adjustment Needed (mm)</Label>
              <Input
                id="adjustment"
                type="number"
                step="0.01"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="-0.05"
              />
              <p className="text-xs text-muted-foreground">
                Negative = closer to bed, Positive = further from bed
              </p>
            </div>

            <Button onClick={calculateNewOffset} className="w-full">
              Calculate New Offset
            </Button>

            {result && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription className="whitespace-pre-line">
                  {result}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visual Guide</CardTitle>
          <CardDescription>
            What to look for during calibration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="examples" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="examples">Examples</TabsTrigger>
              <TabsTrigger value="process">Process</TabsTrigger>
              <TabsTrigger value="troubleshooting">Issues</TabsTrigger>
            </TabsList>
            
            <TabsContent value="examples" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Too High
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Lines don't stick</li>
                      <li>• Gaps between lines</li>
                      <li>• Round cross-section</li>
                      <li>• Easy to remove</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Just Right
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Lines touch perfectly</li>
                      <li>• Slightly squished</li>
                      <li>• Good adhesion</li>
                      <li>• Smooth surface</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-red-200 dark:border-red-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Too Low
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <ul className="space-y-1">
                      <li>• Transparent lines</li>
                      <li>• Nozzle scraping</li>
                      <li>• Ridges between lines</li>
                      <li>• Hard to remove</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="process" className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Prepare the bed</h4>
                    <p className="text-sm text-muted-foreground">
                      Clean with isopropyl alcohol and heat to target temperature
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Start the print</h4>
                    <p className="text-sm text-muted-foreground">
                      Begin printing the calibration pattern at 50% speed
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Live adjust</h4>
                    <p className="text-sm text-muted-foreground">
                      Use baby-stepping to adjust Z-offset while printing
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Save settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Note the final offset and save to your printer
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-4">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="no-stick">
                  <AccordionTrigger>Print won't stick at all</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Bed may be contaminated - clean thoroughly</li>
                      <li>• Check bed leveling - run auto-level if available</li>
                      <li>• Increase bed temperature by 5-10°C</li>
                      <li>• Try a different surface (PEI, glass, etc.)</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="elephant-foot">
                  <AccordionTrigger>First layer spreading too much</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Z-offset too low - increase by 0.02-0.05mm</li>
                      <li>• Reduce first layer flow rate to 90-95%</li>
                      <li>• Enable elephant foot compensation</li>
                      <li>• Lower bed temperature slightly</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="warping">
                  <AccordionTrigger>Corners lifting during print</AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Increase bed temperature</li>
                      <li>• Use brim or raft for better adhesion</li>
                      <li>• Check for drafts - use enclosure if needed</li>
                      <li>• Clean bed surface thoroughly</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Next Steps</AlertTitle>
        <AlertDescription>
          Once you have perfect first layer adhesion, proceed to Temperature Tower calibration 
          to find the optimal printing temperature for your filament.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default FirstLayerCalibration;