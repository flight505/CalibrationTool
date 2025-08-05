import { useState } from 'react';
import { Move3D, Info, Lightbulb, Zap, Download, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePressureAdvanceTower } from '@/utils/orcaPressureAdvanceTower';

interface PressureAdvanceProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const PressureAdvance: React.FC<PressureAdvanceProps> = ({ onNavigate }) => {
  const [extruderType, setExtruderType] = useState('DDE');
  const [paStep, setPaStep] = useState(0.002);
  const [measuredHeight, setMeasuredHeight] = useState(8);
  const [result, setResult] = useState<number | null>(null);
  
  // Tower generation states
  const [towerExtruderType, setTowerExtruderType] = useState<'direct_drive' | 'bowden' | 'high_speed'>('direct_drive');
  const [startPA, setStartPA] = useState('0.00');
  const [endPA, setEndPA] = useState('0.10');
  const [paStepGen, setPAStepGen] = useState('0.01');
  const [testPattern, setTestPattern] = useState<'corners' | 'lines' | 'combined'>('corners');
  const [printSpeed, setPrintSpeed] = useState('100');
  const [includeLabels, setIncludeLabels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);

  const calculate = () => {
    const calculatedPA = paStep * measuredHeight;
    setResult(calculatedPA);
  };
  
  const handleExtruderTypeChange = (type: 'direct_drive' | 'bowden' | 'high_speed') => {
    setTowerExtruderType(type);
    // Set appropriate defaults based on extruder type
    if (type === 'direct_drive') {
      setStartPA('0.00');
      setEndPA('0.10');
      setPAStepGen('0.01');
    } else if (type === 'bowden') {
      setStartPA('0.00');
      setEndPA('0.50');
      setPAStepGen('0.05');
    } else {
      setStartPA('0.00');
      setEndPA('0.05');
      setPAStepGen('0.005');
    }
  };
  
  const generateTower = async () => {
    try {
      setGenerating(true);
      
      const tower = await generatePressureAdvanceTower({
        extruderType: towerExtruderType,
        startValue: parseFloat(startPA),
        endValue: parseFloat(endPA),
        stepSize: parseFloat(paStepGen),
        testPattern,
        printSpeed: parseInt(printSpeed),
        includeLabels,
        includeModifierMesh: true
      });
      
      // Download main STL
      const url = URL.createObjectURL(tower.mainSTL);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pa_tower_${towerExtruderType}_${startPA}-${endPA}.stl`;
      a.click();
      URL.revokeObjectURL(url);
      
      // If modifier meshes are included, download them as well
      if (tower.modifierMeshes) {
        tower.modifierMeshes.forEach((mesh, index) => {
          const modUrl = URL.createObjectURL(mesh);
          const modA = document.createElement('a');
          modA.href = modUrl;
          modA.download = `pa_modifier_section_${index}.stl`;
          setTimeout(() => {
            modA.click();
            URL.revokeObjectURL(modUrl);
          }, (index + 1) * 500); // Stagger downloads
        });
      }
      
      setTowerInstructions(tower.instructions);
      setGenResult(`✅ Pressure Advance tower generated successfully!\n${tower.sections.length} PA sections from ${startPA} to ${endPA}`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setGenResult('❌ Error generating tower. Please try again.');
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
                docPath="/docs/orca-slicer/calibration/adaptive-pressure-advance-calibration.md"
                tooltip="View pressure advance calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Move3D className="w-8 h-8" />
            Pressure Advance Calibration
          </CardTitle>
          <CardDescription className="text-base">
            Tune pressure advance for sharper corners and better print quality
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="calculate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculate">Calculate PA</TabsTrigger>
          <TabsTrigger value="generate">Generate Tower</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculate">
          <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>PA Calculator</CardTitle>
            <CardDescription>
              Calculate PA value from tower test results
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="extruder-type">Extruder Type</Label>
              <Select value={extruderType} onValueChange={setExtruderType}>
                <SelectTrigger id="extruder-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DDE">Direct Drive (DDE)</SelectItem>
                  <SelectItem value="Bowden">Bowden</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pa-step">PA Step (A)</Label>
              <Input
                id="pa-step"
                type="number"
                step="0.001"
                value={paStep}
                onChange={(e) => setPaStep(parseFloat(e.target.value) || 0)}
                placeholder="0.002"
              />
              <p className="text-sm text-muted-foreground">
                Typical: {extruderType === 'DDE' ? '0.002' : '0.02'} for {extruderType}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="measured-height">Measured Height (B) in mm</Label>
              <Input
                id="measured-height"
                type="number"
                value={measuredHeight}
                onChange={(e) => setMeasuredHeight(parseFloat(e.target.value) || 0)}
                placeholder="8"
              />
              <p className="text-sm text-muted-foreground">
                Height where corners look best
              </p>
            </div>

            <Button onClick={calculate} className="w-full">
              <Move3D className="mr-2 h-4 w-4" />
              Calculate PA Value
            </Button>

            {result !== null && (
              <Alert className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
                <AlertTitle>Pressure Advance Value</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {result.toFixed(4)}
                </AlertDescription>
                <p className="text-sm mt-2">
                  Enter this value in Filament Settings → Advanced → Pressure Advance
                </p>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PA Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertTitle className="text-sm">Quick Reference</AlertTitle>
                <AlertDescription className="mt-2">
                  <strong>Direct Drive:</strong> 0.002-0.050<br />
                  <strong>Bowden:</strong> 0.020-0.200<br />
                  <strong>Formula:</strong> PA = Step × Height
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-1">What to Look For:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Sharp 90° corners without bulging</li>
                  <li>• No gaps at corner starts</li>
                  <li>• Consistent line width</li>
                  <li>• Clean direction changes</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Common Issues:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Too low: Bulging corners</li>
                  <li>• Too high: Gaps at corners</li>
                  <li>• Way off: Inconsistent extrusion</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Pressure Advance Tower</CardTitle>
              <CardDescription>
                Create a custom PA calibration tower for your printer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-extruder">Extruder Type</Label>
                  <Select value={towerExtruderType} onValueChange={handleExtruderTypeChange}>
                    <SelectTrigger id="gen-extruder">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct_drive">Direct Drive</SelectItem>
                      <SelectItem value="bowden">Bowden</SelectItem>
                      <SelectItem value="high_speed">High-Speed Direct</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="test-pattern">Test Pattern</Label>
                  <Select value={testPattern} onValueChange={(v) => setTestPattern(v as 'corners' | 'lines' | 'combined')}>
                    <SelectTrigger id="test-pattern">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="corners">Corner Test (Recommended)</SelectItem>
                      <SelectItem value="lines">Line Test</SelectItem>
                      <SelectItem value="combined">Combined Pattern</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-pa">Start PA Value</Label>
                  <Input
                    id="start-pa"
                    type="number"
                    step="0.01"
                    value={startPA}
                    onChange={(e) => setStartPA(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-pa">End PA Value</Label>
                  <Input
                    id="end-pa"
                    type="number"
                    step="0.01"
                    value={endPA}
                    onChange={(e) => setEndPA(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pa-step-gen">PA Step</Label>
                  <Input
                    id="pa-step-gen"
                    type="number"
                    step="0.001"
                    value={paStepGen}
                    onChange={(e) => setPAStepGen(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="print-speed">Print Speed (mm/s)</Label>
                <Input
                  id="print-speed"
                  type="number"
                  value={printSpeed}
                  onChange={(e) => setPrintSpeed(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Higher speeds make PA effects more visible
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="include-labels" className="cursor-pointer">
                  Include PA Value Labels
                </Label>
                <Switch
                  id="include-labels"
                  checked={includeLabels}
                  onCheckedChange={setIncludeLabels}
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
                    <Download className="mr-2 h-4 w-4" />
                    Generate PA Tower STL
                  </>
                )}
              </Button>
              
              {genResult && (
                <Alert className={genResult.includes('✅') ? "bg-green-50/50 dark:bg-green-950/20" : ""}>
                  <AlertDescription className="whitespace-pre-line">
                    {genResult}
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
        <AccordionItem value="instructions">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Understanding Pressure Advance
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertTitle>What is Pressure Advance?</AlertTitle>
                <AlertDescription>
                  PA compensates for the elastic properties of molten filament. During acceleration, 
                  pressure builds up in the nozzle. During deceleration, this pressure needs to be 
                  relieved. PA adjusts extrusion in advance to maintain consistent flow.
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Test Methods</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Tower Method:</strong> Height-based calibration</p>
                    <p><strong>Line Method:</strong> Visual line quality</p>
                    <p><strong>Pattern Method:</strong> Corner sharpness test</p>
                    <p className="text-muted-foreground mt-2">
                      Tower method is most reliable for beginners
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Firmware Support</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    <p><strong>Marlin:</strong> Linear Advance (M900)</p>
                    <p><strong>Klipper:</strong> Pressure Advance (SET_PRESSURE_ADVANCE)</p>
                    <p><strong>RepRap:</strong> Pressure Advance (M572)</p>
                    <p className="text-muted-foreground mt-2">
                      Orca Slicer handles this automatically
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>Pro Tip:</strong> Different materials need different PA values even on the same printer. 
                  Flexible materials typically need lower values, while stiff materials need higher values.
                </AlertDescription>
              </Alert>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default PressureAdvance;