import { useState } from 'react';
import { Calculator, Ruler, Info, Lightbulb, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import OrcaFlowCalibration from '@/components/OrcaFlowCalibration';

const YoloFlowCalibration = () => {
  const [flowRatioOld, setFlowRatioOld] = useState(0.98);
  const [modifier, setModifier] = useState(0.04);
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const newFlowRatio = flowRatioOld + modifier;
    setResult(newFlowRatio);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5" />
          YOLO Mode Calculator
        </CardTitle>
        <CardDescription>
          Quick flow rate adjustment using direct addition
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>How YOLO Mode Works</AlertTitle>
          <AlertDescription>
            YOLO mode simplifies flow calibration by using direct addition instead of percentages. 
            Print the YOLO test pattern, select the best looking block, and add that modifier to your current flow ratio.
            Range is -0.04 to +0.04 for fine-tuning.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="flow-ratio-old">Current Flow Ratio</Label>
            <Input
              id="flow-ratio-old"
              type="number"
              step="0.01"
              value={flowRatioOld}
              onChange={(e) => setFlowRatioOld(parseFloat(e.target.value) || 0)}
              placeholder="0.98"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modifier">Modifier (from test print)</Label>
            <Input
              id="modifier"
              type="number"
              step="0.01"
              value={modifier}
              onChange={(e) => setModifier(parseFloat(e.target.value) || 0)}
              placeholder="0.04"
            />
            <p className="text-sm text-muted-foreground">
              Value from -0.04 to +0.04 based on which block looks best
            </p>
          </div>

          <Button onClick={calculate} className="w-full">
            <Calculator className="mr-2 h-4 w-4" />
            Calculate New Flow Ratio
          </Button>

          {result !== null && (
            <Alert className="bg-green-50/50 dark:bg-green-950/20 border-green-200">
              <AlertTitle>New Flow Ratio</AlertTitle>
              <AlertDescription className="text-2xl font-bold">
                {result.toFixed(3)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-2">Quick Reference</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Smoothest top surface = correct flow</li>
            <li>• Gaps between lines = increase modifier</li>
            <li>• Over-extrusion ridges = decrease modifier</li>
            <li>• Test takes only 10 minutes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

const FlowRateCalibration = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Calculator className="w-8 h-8" />
            Flow Rate Calibration
          </CardTitle>
          <CardDescription className="text-base">
            Choose between precise cube measurement or quick YOLO mode
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Two Methods Available</AlertTitle>
        <AlertDescription>
          <strong>Cube Method:</strong> Most accurate, requires calipers. Measure actual wall thickness.
          <br />
          <strong>YOLO Mode:</strong> Quick visual method. Perfect for fine-tuning or when you don't have calipers.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="cube" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cube" className="flex items-center gap-2">
            <Ruler className="w-4 h-4" />
            Cube Method
          </TabsTrigger>
          <TabsTrigger value="yolo" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            YOLO Mode
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="cube" className="mt-6">
          <OrcaFlowCalibration />
        </TabsContent>
        
        <TabsContent value="yolo" className="mt-6">
          <YoloFlowCalibration />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FlowRateCalibration;