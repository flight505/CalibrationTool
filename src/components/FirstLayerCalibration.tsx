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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            How This Calculator Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm">
            <p>
              <strong>Important:</strong> This calculator is a simple math tool that helps you calculate your new Z-offset 
              based on adjustments you make while printing the test pattern.
            </p>
            
            <div className="border-l-4 border-blue-500 pl-4 space-y-2">
              <p className="font-semibold">The Process:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Print the test STL with your current Z-offset</li>
                <li>Observe if nozzle is too high or too low</li>
                <li>Use baby stepping to adjust while printing</li>
                <li>Note how much you adjusted (e.g., -0.05mm)</li>
                <li>Use this calculator to add that adjustment to your current offset</li>
              </ol>
            </div>

            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/20">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The STL file is just a test pattern - the calculation doesn't depend on it. 
                You're simply adding your live adjustment to your current Z-offset.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Does Your Printer Have Auto Z-Calibration?</CardTitle>
          <CardDescription>
            Modern printers handle Z-offset differently than traditional ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Modern Auto-Calibration Printers
              </h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">Examples: FL-SUN S1 Pro, Bambu Lab, Prusa MK4</p>
                <ul className="space-y-1 ml-4">
                  <li>• One-click auto bed leveling</li>
                  <li>• Baby stepping saves automatically</li>
                  <li>• May have per-surface profiles</li>
                  <li>• Often use LIDAR or force sensors</li>
                </ul>
                <Alert className="mt-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    You may not need the calculator - your printer likely saves adjustments automatically!
                  </AlertDescription>
                </Alert>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Traditional Manual Printers
              </h4>
              <div className="text-sm space-y-2 text-muted-foreground">
                <p className="font-medium">Examples: Ender 3, CR-10, Most DIY Printers</p>
                <ul className="space-y-1 ml-4">
                  <li>• Manual bed leveling</li>
                  <li>• Baby stepping resets each print</li>
                  <li>• Need to manually save Z-offset</li>
                  <li>• Use paper or feeler gauge method</li>
                </ul>
                <Alert className="mt-3">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Use the calculator below to determine your new permanent Z-offset value.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            Critical Slicer Settings - READ THIS!
          </CardTitle>
          <CardDescription>
            The test pattern requires specific slicer settings to work properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Default 45° Won't Work!</AlertTitle>
            <AlertDescription>
              Most slicers default to 45° infill angle, which hides first layer problems. 
              You MUST change to 0° (horizontal) for this calibration to work.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">OrcaSlicer Settings:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                <li>Go to <strong>Print Settings → Quality → Bottom surface pattern</strong></li>
                <li>Set to <strong>Monotonic</strong> or <strong>Rectilinear</strong></li>
                <li>Go to <strong>Print Settings → Strength → Infill</strong></li>
                <li>Set <strong>Infill direction</strong> to <strong>0°</strong></li>
              </ol>
            </div>

            <div className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm font-medium">Why Horizontal Lines?</p>
              <ul className="text-xs text-muted-foreground space-y-1 mt-1">
                <li>• 45° diagonal lines hide gaps and over-squish</li>
                <li>• Horizontal lines clearly show adhesion issues</li>
                <li>• Easier to see line separation or ridges</li>
                <li>• Allows progressive adjustment bottom-to-top</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-center font-medium">
                The pattern prints: Frame → Then horizontal lines from bottom to top
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              For manual printers: Calculate your new permanent Z-offset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>When to use this:</strong> If your printer doesn't save baby stepping automatically, 
                use this to calculate what value to save in your printer's memory or start G-code.
              </AlertDescription>
            </Alert>

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
              <Label htmlFor="adjustment">Baby Stepping Adjustment Made (mm)</Label>
              <Input
                id="adjustment"
                type="number"
                step="0.01"
                value={adjustment}
                onChange={(e) => setAdjustment(e.target.value)}
                placeholder="-0.05"
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Enter the total baby stepping adjustment you made during the test print
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  • Negative (-) = moved nozzle closer to bed
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  • Positive (+) = moved nozzle away from bed
                </p>
              </div>
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
              <Alert className="mb-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Pattern Order:</strong> Frame prints first → Then horizontal lines from bottom to top
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold">Verify slicer settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Confirm infill direction is 0° (horizontal), not 45°
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold">Start print & watch frame</h4>
                    <p className="text-sm text-muted-foreground">
                      The perimeter frame prints first - check initial adhesion
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold">Adjust during horizontal lines</h4>
                    <p className="text-sm text-muted-foreground">
                      As it prints bottom-to-top, baby-step every 20-30mm
                    </p>
                    <div className="mt-2 bg-muted/50 p-2 rounded text-xs">
                      <strong>Tip:</strong> Write Z-offset values on the side with a marker!
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold">Compare sections</h4>
                    <p className="text-sm text-muted-foreground">
                      Each horizontal band shows different Z-offset results
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold">Calculate final offset</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the calculator with your best section's adjustment
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

      <Card>
        <CardHeader>
          <CardTitle>How to Save Your New Z-Offset</CardTitle>
          <CardDescription>
            Firmware-specific instructions for permanent storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="marlin">
              <AccordionTrigger>Marlin Firmware</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Via LCD Menu:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Configuration → Advanced Settings → Probe Z Offset</li>
                    <li>Adjust to your new calculated value</li>
                    <li>Store Settings (or M500 command)</li>
                  </ol>
                  <p className="font-medium mt-3">Via G-code:</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    M851 Z-1.30  ; Set new offset<br/>
                    M500         ; Save to EEPROM
                  </code>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="klipper">
              <AccordionTrigger>Klipper Firmware</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">For probe users:</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    Z_OFFSET_APPLY_PROBE
                  </code>
                  <p className="text-muted-foreground mt-2">This saves your baby stepping to the probe's z_offset</p>
                  
                  <p className="font-medium mt-3">Manual method:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Edit printer.cfg</li>
                    <li>Find [stepper_z] position_endstop or [probe] z_offset</li>
                    <li>Update with new value</li>
                    <li>SAVE_CONFIG</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="prusa">
              <AccordionTrigger>Prusa Firmware</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Prusa printers save Live Z adjustments automatically!
                  </p>
                  <p className="font-medium mt-2">During first layer calibration:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Turn knob to adjust Live Z</li>
                    <li>Value saves automatically</li>
                    <li>Different values can be saved per steel sheet</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="duet">
              <AccordionTrigger>Duet/RepRap Firmware</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Console Commands:</p>
                  <code className="block bg-muted p-2 rounded text-xs">
                    G31 Z1.30    ; Set new Z offset<br/>
                    M500         ; Save to config-override.g
                  </code>
                  <p className="text-muted-foreground mt-2">
                    Or edit config.g directly and update the G31 Z value
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="orcaslicer">
              <AccordionTrigger>OrcaSlicer Software Method</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    If your printer doesn't support saving Z-offset:
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                    <li>Go to Process Settings → Others</li>
                    <li>Find "Z offset" field</li>
                    <li>Enter your calculated offset value</li>
                    <li>This adds offset to every print automatically</li>
                  </ol>
                  <Alert className="mt-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      This method works but requires the offset in every print profile
                    </AlertDescription>
                  </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
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