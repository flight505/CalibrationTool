import { useState, useEffect } from 'react';
import { RotateCcw, Info, Lightbulb, AlertCircle, Download, Printer, Package, ChevronDown, ArrowRight, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';
import { generateRetractionTestTower } from '@/utils/stlGenerator';

interface RetractionTestProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const RetractionTest: React.FC<RetractionTestProps> = ({ onNavigate }) => {
  const [extruderType, setExtruderType] = useState('Direct Drive');
  const [start, setStart] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(15);
  const [factor, setFactor] = useState(0.1);
  const [result, setResult] = useState<number | null>(null);
  
  // STL Generation states
  const [stlStartRetraction, setStlStartRetraction] = useState(0);
  const [stlEndRetraction, setStlEndRetraction] = useState(2);
  const [stlRetractionStep, setStlRetractionStep] = useState(0.1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHeightGuide, setShowHeightGuide] = useState(false);
  
  // Material recommendations
  const materialRecommendations = {
    'Direct Drive': {
      'PLA': { start: 0.2, end: 0.8, optimal: '0.4-0.6' },
      'ABS': { start: 0.2, end: 0.8, optimal: '0.4-0.6' },
      'PETG': { start: 0.5, end: 1.5, optimal: '0.8-1.2' },
      'TPU': { start: 0.0, end: 0.4, optimal: '0.1-0.3' },
      'Nylon': { start: 0.3, end: 1.0, optimal: '0.5-0.8' }
    },
    'Bowden': {
      'PLA': { start: 3.0, end: 6.0, optimal: '4.0-5.0' },
      'ABS': { start: 3.0, end: 6.0, optimal: '4.0-5.0' },
      'PETG': { start: 4.0, end: 7.0, optimal: '5.0-6.0' },
      'TPU': { start: 1.0, end: 3.0, optimal: '1.5-2.5' },
      'Nylon': { start: 3.5, end: 6.5, optimal: '4.5-5.5' }
    }
  };

  // Update STL generator defaults when extruder type changes
  useEffect(() => {
    setStlStartRetraction(extruderType === 'Direct Drive' ? 0 : 1);
    setStlEndRetraction(extruderType === 'Direct Drive' ? 2 : 6);
    setStlRetractionStep(extruderType === 'Direct Drive' ? 0.1 : 0.2);
  }, [extruderType]);

  const calculate = () => {
    const retractionLength = start + (measuredHeight * factor);
    setResult(retractionLength);
  };

  const generateSTL = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateRetractionTestTower({
        startRetraction: stlStartRetraction,
        endRetraction: stlEndRetraction,
        retractionStep: stlRetractionStep
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `retraction_test_${stlStartRetraction}-${stlEndRetraction}mm_${stlRetractionStep}step.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate STL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center relative">
          {onNavigate && (
            <div className="absolute right-4 top-4">
              <HelpButton 
                docPath="/docs/orca-slicer/calibration/retraction-calibration.md"
                tooltip="View retraction calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <RotateCcw className="w-8 h-8" />
            Retraction Test Manager
          </CardTitle>
          <CardDescription className="text-base">
            Optimize retraction settings to eliminate stringing
          </CardDescription>
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <p className="text-sm text-center">
              Follow these steps: <span className="font-medium">1. Review Guidelines</span> 
              <ArrowRight className="inline w-4 h-4 mx-2" />
              <span className="font-medium">2. Generate & Print Test</span>
              <ArrowRight className="inline w-4 h-4 mx-2" />
              <span className="font-medium">3. Calculate Optimal Value</span>
            </p>
          </div>
        </CardHeader>
      </Card>

      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
        {/* Step 1: Retraction Guidelines */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
              Retraction Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Material Recommendations
                </h4>
                <div className="grid gap-2">
                  {['PLA', 'ABS', 'PETG', 'TPU', 'Nylon'].map((material) => {
                    const rec = materialRecommendations[extruderType][material];
                    return (
                      <div key={material} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="font-medium">{material}:</span>
                        <div className="text-sm text-right">
                          <span className="text-muted-foreground">Test: {rec.start}-{rec.end}mm</span>
                          <span className="ml-2 font-medium text-green-600 dark:text-green-400">Best: {rec.optimal}mm</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground">
                  {extruderType === 'Direct Drive' ? 
                    'Direct drive systems need minimal retraction to prevent clogs' : 
                    'Bowden systems require more retraction due to tube length'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">How to Use Test Tower:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Print the generated STL file</li>
                  <li>• Each layer tests a different retraction value</li>
                  <li>• Look for the cleanest section with no stringing</li>
                  <li>• Measure the height where stringing stops</li>
                  <li>• Use the calculator in step 3 to find exact value</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">What to Look For:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• No stringing between towers</li>
                  <li>• Clean travel moves</li>
                  <li>• No oozing during moves</li>
                  <li>• Good restart quality</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Retraction Speed:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Typical: 40-60mm/s</li>
                  <li>• Too fast: Filament grinding</li>
                  <li>• Too slow: Ineffective</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Retraction Test STL Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
              Generate Test Tower
            </CardTitle>
            <CardDescription>
              Create a parametric retraction test STL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Remember these values!</strong> You'll need them in Step 3 to calculate your optimal retraction.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Label htmlFor="stl-start">Start Retraction Length (mm)</Label>
              <Input
                id="stl-start"
                type="number"
                step="0.5"
                value={stlStartRetraction}
                onChange={(e) => setStlStartRetraction(parseFloat(e.target.value) || 0)}
                placeholder={extruderType === 'Direct Drive' ? '0' : '1'}
              />
              <p className="text-sm text-muted-foreground">
                {extruderType === 'Direct Drive' ? 'Typical: 0mm' : 'Typical: 1mm'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stl-end">End Retraction Length (mm)</Label>
              <Input
                id="stl-end"
                type="number"
                step="0.5"
                value={stlEndRetraction}
                onChange={(e) => setStlEndRetraction(parseFloat(e.target.value) || 0)}
                placeholder={extruderType === 'Direct Drive' ? '2' : '6'}
              />
              <p className="text-sm text-muted-foreground">
                {extruderType === 'Direct Drive' ? 'Typical: 2mm' : 'Typical: 6mm'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stl-step">Step Size (mm)</Label>
              <Input
                id="stl-step"
                type="number"
                step="0.05"
                value={stlRetractionStep}
                onChange={(e) => setStlRetractionStep(parseFloat(e.target.value) || 0.1)}
                placeholder="0.1"
              />
              <p className="text-sm text-muted-foreground">
                {extruderType === 'Direct Drive' ? 'Typical: 0.1mm' : 'Typical: 0.2mm'}
              </p>
            </div>

            <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
              <Printer className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div><strong>Tower Height:</strong> {(1.0 + ((stlEndRetraction - stlStartRetraction) / stlRetractionStep)).toFixed(1)}mm</div>
                  <div><strong>Test Sections:</strong> {Math.floor((stlEndRetraction - stlStartRetraction) / stlRetractionStep) + 1}</div>
                  <div><strong>Tower Configuration:</strong> 4 towers (~3mm diameter each)</div>
                  <div><strong>Base Plate:</strong> 40×15×0.4mm</div>
                </div>
              </AlertDescription>
            </Alert>

            <Button 
              onClick={generateSTL} 
              className="w-full"
              disabled={isGenerating || stlRetractionStep <= 0 || stlEndRetraction <= stlStartRetraction}
            >
              <Download className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download STL'}
            </Button>

            {/* Collapsible Height reference guide */}
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="height-guide" className="border rounded-md bg-muted/30">
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2 text-sm">
                    <Info className="h-4 w-4" />
                    <span>Height Reference Guide ({Math.floor((stlEndRetraction - stlStartRetraction) / stlRetractionStep) + 1} test layers)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    Each layer tests a different retraction value. Find the cleanest layer and note its height.
                  </p>
                  <div className="space-y-1 text-xs max-h-48 overflow-y-auto">
                    <div className="font-mono sticky top-0 bg-background/95 backdrop-blur-sm py-1">Base: 0.0 - 1.0mm (no retraction)</div>
                    {Array.from({ length: Math.floor((stlEndRetraction - stlStartRetraction) / stlRetractionStep) + 1 }, (_, i) => {
                      const retraction = stlStartRetraction + (i * stlRetractionStep);
                      const layerHeight = 1.0 + i;
                      return (
                        <div key={i} className="font-mono hover:bg-muted/50 px-1 rounded">
                          Height {layerHeight.toFixed(1)}mm → {retraction.toFixed(2)}mm retraction
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Step 3: Retraction Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">3</span>
              <Calculator className="h-5 w-5" />
              Calculate Results
            </CardTitle>
            <CardDescription>
              Find your optimal retraction value
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Example:</strong> If you used Start: 0mm, Step: 0.1mm in the STL generator, and the cleanest section is at 15mm height:
                <div className="mt-2 font-mono text-center">
                  0mm + (15mm × 0.1mm) = <strong>1.5mm retraction</strong>
                </div>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="start">Start Retraction from STL (mm)</Label>
              <Input
                id="start"
                type="number"
                step="0.1"
                value={start}
                onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                The start value you used when generating the STL
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="measured-height">Measured Height (mm)</Label>
              <Input
                id="measured-height"
                type="number"
                value={measuredHeight}
                onChange={(e) => setMeasuredHeight(parseFloat(e.target.value) || 0)}
                placeholder="15"
              />
              <p className="text-sm text-muted-foreground">
                Measure where stringing stops on your printed tower
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factor">Step Size from STL (mm)</Label>
              <Input
                id="factor"
                type="number"
                step="0.01"
                value={factor}
                onChange={(e) => setFactor(parseFloat(e.target.value) || 0)}
                placeholder="0.1"
              />
              <p className="text-sm text-muted-foreground">
                The step size you used when generating the STL
              </p>
            </div>

            {(start !== 0 || measuredHeight !== 0 || factor !== 0) && (
              <div className="p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-mono text-center">
                  {start}mm + ({measuredHeight}mm × {factor}mm) = <strong>{(start + (measuredHeight * factor)).toFixed(5)}mm</strong>
                </p>
              </div>
            )}

            <Button onClick={calculate} className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Retraction Length
            </Button>

            {result !== null && (
              <Alert className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
                <AlertTitle>Optimal Retraction Length</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {result.toFixed(5)}mm
                </AlertDescription>
                <p className="text-sm mt-2">
                  Enter this value in: <strong>Filament Settings → Setting Overrides → Retraction Length</strong>
                </p>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Advanced Retraction Settings
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Z-Hop Options</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Normal:</strong> Straight vertical lift</p>
                    <p><strong>Slope:</strong> Diagonal movement</p>
                    <p><strong>Spiral:</strong> Circular lift pattern</p>
                    <p><strong>Auto:</strong> Slicer decides based on geometry</p>
                    <p className="text-muted-foreground mt-2">
                      Typical Z-hop: 0.2-0.4mm
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Additional Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Wipe:</strong> Clean nozzle on perimeter</p>
                    <p><strong>Coast:</strong> Stop extruding before end</p>
                    <p><strong>Extra restart:</strong> Prime after retraction</p>
                    <p className="text-muted-foreground mt-2">
                      Enable based on material behavior
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <strong>Pro Tip:</strong> Less retraction is often better. Find the minimum that eliminates stringing 
                  to avoid clogs and heat creep. PETG and TPU are naturally stringy - perfect elimination may not be possible.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default RetractionTest;