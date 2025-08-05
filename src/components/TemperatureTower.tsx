import { useState } from 'react';
import { Thermometer, Info, FileText, Download, Settings } from 'lucide-react';
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
import { generateTemperatureTower } from '@/utils/orcaTemperatureTower';

interface TemperatureTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const TemperatureTower: React.FC<TemperatureTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [bestTemp, setBestTemp] = useState('');
  const [result, setResult] = useState<string | null>(null);
  
  // Tower generation states
  const [startTemp, setStartTemp] = useState('220');
  const [endTemp, setEndTemp] = useState('190');
  const [tempStep, setTempStep] = useState('5');
  const [includeBridge, setIncludeBridge] = useState(true);
  const [includeOverhang, setIncludeOverhang] = useState(true);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);

  const materialRanges = {
    PLA: { min: 190, max: 230, typical: 210, start: 220, end: 190 },
    PETG: { min: 230, max: 250, typical: 240, start: 250, end: 220 },
    ABS: { min: 240, max: 270, typical: 255, start: 260, end: 230 },
    TPU: { min: 210, max: 240, typical: 225, start: 240, end: 210 },
    'PA-CF': { min: 280, max: 320, typical: 300, start: 310, end: 280 },
  };
  
  // Update tower settings when material changes
  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    const range = materialRanges[newMaterial as keyof typeof materialRanges];
    setStartTemp(range.start.toString());
    setEndTemp(range.end.toString());
  };

  const generateTower = async () => {
    try {
      setGenerating(true);
      
      const tower = await generateTemperatureTower({
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'PC' | 'PA',
        startValue: parseInt(startTemp),
        endValue: parseInt(endTemp),
        stepSize: parseInt(tempStep),
        includeBridge,
        includeOverhang,
        includeLabels,
        includeModifierMesh: true
      });
      
      // Download main STL
      const url = URL.createObjectURL(tower.mainSTL);
      const a = document.createElement('a');
      a.href = url;
      a.download = `temperature_tower_${material.toLowerCase()}_${startTemp}-${endTemp}.stl`;
      a.click();
      URL.revokeObjectURL(url);
      
      // If modifier meshes are included, download them as well
      if (tower.modifierMeshes) {
        tower.modifierMeshes.forEach((mesh, index) => {
          const modUrl = URL.createObjectURL(mesh);
          const modA = document.createElement('a');
          modA.href = modUrl;
          modA.download = `modifier_section_${index}.stl`;
          setTimeout(() => {
            modA.click();
            URL.revokeObjectURL(modUrl);
          }, (index + 1) * 500); // Stagger downloads
        });
      }
      
      setTowerInstructions(tower.instructions);
      
      // Show success alert
      setResult(`✅ Temperature tower generated successfully!\n${tower.sections.length} temperature sections from ${startTemp}°C to ${endTemp}°C`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setResult('❌ Error generating tower. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const analyze = () => {
    const temp = parseInt(bestTemp);
    if (isNaN(temp)) {
      setResult('Please enter a valid temperature');
      return;
    }

    const range = materialRanges[material as keyof typeof materialRanges];
    
    if (temp < range.min) {
      setResult(`⚠️ ${temp}°C is below the recommended range for ${material}. Consider retesting starting at ${range.min}°C.`);
    } else if (temp > range.max) {
      setResult(`⚠️ ${temp}°C is above the recommended range for ${material}. This may cause degradation. Consider ${range.max}°C or lower.`);
    } else {
      const firstLayerTemp = material === 'PETG' ? temp + 10 : temp + 5;
      setResult(`✅ Optimal temperature for ${material}: ${temp}°C\nFirst layer temperature: ${firstLayerTemp}°C`);
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
                tooltip="View temperature calibration documentation"
                onNavigate={onNavigate}
              />
            </div>
          )}
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Thermometer className="w-8 h-8" />
            Temperature Tower Analysis
          </CardTitle>
          <CardDescription className="text-base">
            Find the optimal printing temperature for your filament
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analyze" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analyze">Analyze Results</TabsTrigger>
          <TabsTrigger value="generate">Generate Tower</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analyze">
          <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temperature Analysis</CardTitle>
            <CardDescription>
              Enter the best temperature from your tower test
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

            <div className="space-y-2">
              <Label htmlFor="best-temp">Best Temperature (°C)</Label>
              <Input
                id="best-temp"
                type="number"
                value={bestTemp}
                onChange={(e) => setBestTemp(e.target.value)}
                placeholder={materialRanges[material as keyof typeof materialRanges].typical.toString()}
              />
              <p className="text-sm text-muted-foreground">
                Typical range: {materialRanges[material as keyof typeof materialRanges].min}°C - {materialRanges[material as keyof typeof materialRanges].max}°C
              </p>
            </div>

            <Button onClick={analyze} className="w-full">
              <Thermometer className="mr-2 h-4 w-4" />
              Analyze Temperature
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

        <Card>
          <CardHeader>
            <CardTitle>Temperature Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-semibold mb-1">What to Look For:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Best layer adhesion without stringing</li>
                  <li>• Good overhang performance</li>
                  <li>• Smooth surface finish</li>
                  <li>• No drooping on bridges</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-1">Common Issues:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Too hot: Stringing, drooping, glossy finish</li>
                  <li>• Too cold: Poor adhesion, rough surface</li>
                  <li>• Just right: Matte finish, strong layers</li>
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
              <CardTitle>Generate Temperature Tower</CardTitle>
              <CardDescription>
                Create a custom temperature calibration tower for your material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gen-material">Material Type</Label>
                  <Select value={material} onValueChange={handleMaterialChange}>
                    <SelectTrigger id="gen-material">
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
                
                <div className="space-y-2">
                  <Label htmlFor="temp-step">Temperature Step (°C)</Label>
                  <Input
                    id="temp-step"
                    type="number"
                    value={tempStep}
                    onChange={(e) => setTempStep(e.target.value)}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-temp">Start Temperature (°C)</Label>
                  <Input
                    id="start-temp"
                    type="number"
                    value={startTemp}
                    onChange={(e) => setStartTemp(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-temp">End Temperature (°C)</Label>
                  <Input
                    id="end-temp"
                    type="number"
                    value={endTemp}
                    onChange={(e) => setEndTemp(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-bridge" className="cursor-pointer">
                    Include Bridge Test
                  </Label>
                  <Switch
                    id="include-bridge"
                    checked={includeBridge}
                    onCheckedChange={setIncludeBridge}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-overhang" className="cursor-pointer">
                    Include Overhang Test (30°, 45°, 60°, 75°)
                  </Label>
                  <Switch
                    id="include-overhang"
                    checked={includeOverhang}
                    onCheckedChange={setIncludeOverhang}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-labels" className="cursor-pointer">
                    Include Temperature Labels
                  </Label>
                  <Switch
                    id="include-labels"
                    checked={includeLabels}
                    onCheckedChange={setIncludeLabels}
                  />
                </div>
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
                    Generate Temperature Tower STL
                  </>
                )}
              </Button>
              
              {result && result.includes('tower generated') && (
                <Alert className="bg-green-50/50 dark:bg-green-950/20">
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
        </TabsContent>
      </Tabs>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="instructions">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              How to Run a Temperature Tower Test
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Test Procedure</AlertTitle>
                <AlertDescription>
                  <ol className="mt-2 space-y-2">
                    <li><strong>1. Generate Tower:</strong> In Orca Slicer, go to Calibration → Temperature Tower</li>
                    <li><strong>2. Set Range:</strong> Start 10°C above typical, end 10°C below</li>
                    <li><strong>3. Print:</strong> The tower will change temperature every 5mm</li>
                    <li><strong>4. Examine:</strong> Look for the height with best quality</li>
                    <li><strong>5. Measure:</strong> Note the temperature at that height</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Temperature Ranges by Material</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      <li><strong>PLA:</strong> 190-230°C (typically 210°C)</li>
                      <li><strong>PETG:</strong> 230-250°C (typically 240°C)</li>
                      <li><strong>ABS:</strong> 240-270°C (typically 255°C)</li>
                      <li><strong>TPU:</strong> 210-240°C (typically 225°C)</li>
                      <li><strong>PA-CF:</strong> 280-320°C (typically 300°C)</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">First Layer Temperature</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>For better bed adhesion, increase first layer temp by:</p>
                    <ul className="space-y-1">
                      <li>• <strong>PLA/ABS/TPU:</strong> +5°C</li>
                      <li>• <strong>PETG:</strong> +5-10°C</li>
                      <li>• <strong>PA-CF:</strong> +0-5°C</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TemperatureTower;