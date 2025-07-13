import { useState } from 'react';
import { RotateCcw, Info, Lightbulb, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const RetractionTest = () => {
  const [extruderType, setExtruderType] = useState('Direct Drive');
  const [start, setStart] = useState(0);
  const [measuredHeight, setMeasuredHeight] = useState(15);
  const [factor, setFactor] = useState(0.1);
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const retractionLength = start + (measuredHeight * factor);
    setResult(retractionLength);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <RotateCcw className="w-8 h-8" />
            Retraction Test Manager
          </CardTitle>
          <CardDescription className="text-base">
            Optimize retraction settings to eliminate stringing
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Retraction Calculator</CardTitle>
            <CardDescription>
              Calculate retraction length from tower test
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
                  <SelectItem value="Direct Drive">Direct Drive</SelectItem>
                  <SelectItem value="Bowden">Bowden</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Typical range: {extruderType === 'Direct Drive' ? '0.2-1.0mm' : '3.0-6.0mm'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start">Start Value</Label>
              <Input
                id="start"
                type="number"
                step="0.1"
                value={start}
                onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
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
                Height where stringing stops
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="factor">Factor (Step Size)</Label>
              <Input
                id="factor"
                type="number"
                step="0.01"
                value={factor}
                onChange={(e) => setFactor(parseFloat(e.target.value) || 0)}
                placeholder="0.1"
              />
              <p className="text-sm text-muted-foreground">
                Typical: {extruderType === 'Direct Drive' ? '0.1' : '0.2'}
              </p>
            </div>

            <Button onClick={calculate} className="w-full">
              <RotateCcw className="mr-2 h-4 w-4" />
              Calculate Retraction Length
            </Button>

            {result !== null && (
              <Alert className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
                <AlertTitle>Retraction Length</AlertTitle>
                <AlertDescription className="text-2xl font-bold">
                  {result.toFixed(5)}mm
                </AlertDescription>
                <p className="text-sm mt-2">
                  Enter in Filament Settings → Setting Overrides → Retraction Length
                </p>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retraction Guidelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm">Material Specific</AlertTitle>
                <AlertDescription className="mt-2 space-y-1">
                  <div><strong>PLA/ABS:</strong> 0.2-0.4mm (DD), 3-5mm (Bowden)</div>
                  <div><strong>PETG:</strong> 0.5-1.5mm (DD), 4-6mm (Bowden)</div>
                  <div><strong>TPU:</strong> 0.1-0.3mm (minimal retraction)</div>
                </AlertDescription>
              </Alert>

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