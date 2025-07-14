import { useState } from 'react';
import { Thermometer, Info, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpButton } from '@/components/HelpButton';

interface TemperatureTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const TemperatureTower: React.FC<TemperatureTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [bestTemp, setBestTemp] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const materialRanges = {
    PLA: { min: 190, max: 230, typical: 210 },
    PETG: { min: 230, max: 250, typical: 240 },
    ABS: { min: 240, max: 270, typical: 255 },
    TPU: { min: 210, max: 240, typical: 225 },
    'PA-CF': { min: 280, max: 320, typical: 300 },
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
              <Select value={material} onValueChange={setMaterial}>
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