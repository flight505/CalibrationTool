import { useState } from 'react';
import { Calculator, Ruler, Download, RotateCcw, Info, CheckCircle2, Lightbulb, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { generateFlowCalibrationCube } from '@/utils/stlGenerator';

interface CalibrationResults {
  singleWallAvg: number | null;
  doubleWallAvg: number | null;
  singleFlowPercent: number | null;
  doubleFlowPercent: number | null;
  avgFlowPercent: number;
  newFlowRate: string;
  adjustment: string;
}

const OrcaFlowCalibration = () => {
  const [nozzleSize, setNozzleSize] = useState('0.4');
  const [currentFlow, setCurrentFlow] = useState(100);
  const [singleWallMeasurements, setSingleWallMeasurements] = useState(['', '', '', '']);
  const [doubleWallMeasurements, setDoubleWallMeasurements] = useState(['', '', '', '']);
  const [results, setResults] = useState<CalibrationResults | null>(null);

  const calculateFlowRate = () => {
    const validSingle = singleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));
    const validDouble = doubleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));

    if (validSingle.length === 0 && validDouble.length === 0) {
      return;
    }

    const singleAvg = validSingle.length > 0 
      ? validSingle.reduce((a, b) => a + b, 0) / validSingle.length 
      : null;
    
    const doubleAvg = validDouble.length > 0 
      ? validDouble.reduce((a, b) => a + b, 0) / validDouble.length 
      : null;

    const nozzleSizeNum = parseFloat(nozzleSize);
    // Upper section is thin wall (1 × nozzle)
    const thinFlowPercent = singleAvg ? (nozzleSizeNum / singleAvg) * 100 : null;
    // Lower section is thick wall (3 × nozzle)
    const thickFlowPercent = doubleAvg ? ((nozzleSizeNum * 3) / doubleAvg) * 100 : null;

    let avgFlowPercent;
    if (thickFlowPercent && thinFlowPercent) {
      avgFlowPercent = (thickFlowPercent + thinFlowPercent) / 2;
    } else {
      avgFlowPercent = thickFlowPercent || thinFlowPercent || 100;
    }

    const newFlowRate = (currentFlow * avgFlowPercent) / 100;

    setResults({
      singleWallAvg: singleAvg,
      doubleWallAvg: doubleAvg,
      singleFlowPercent: thickFlowPercent,
      doubleFlowPercent: thinFlowPercent,
      avgFlowPercent,
      newFlowRate: newFlowRate.toFixed(2),
      adjustment: ((avgFlowPercent - 100)).toFixed(2)
    });
  };

  const resetCalculator = () => {
    setSingleWallMeasurements(['', '', '', '']);
    setDoubleWallMeasurements(['', '', '', '']);
    setResults(null);
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = `Orca Slicer Flow Calibration Results
=====================================
Date: ${new Date().toLocaleString()}
Nozzle Size: ${nozzleSize}mm
Current Flow Rate: ${currentFlow}%

Thin Wall Measurements (Upper): ${singleWallMeasurements.filter(m => m).join(', ')}mm
Thin Wall Average: ${results.singleWallAvg?.toFixed(3) || 'N/A'}mm
Thin Wall Flow %: ${results.doubleFlowPercent?.toFixed(2) || 'N/A'}%

Thick Wall Measurements (Lower): ${doubleWallMeasurements.filter(m => m).join(', ')}mm
Thick Wall Average: ${results.doubleWallAvg?.toFixed(3) || 'N/A'}mm
Thick Wall Flow %: ${results.singleFlowPercent?.toFixed(2) || 'N/A'}%

Overall Average Flow %: ${results.avgFlowPercent.toFixed(2)}%
Recommended New Flow Rate: ${results.newFlowRate}%
Adjustment: ${parseFloat(results.adjustment) > 0 ? '+' : ''}${results.adjustment}%`;

    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow_calibration_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const downloadSTL = () => {
    const nozzleSizeNum = parseFloat(nozzleSize);
    const stlBlob = generateFlowCalibrationCube({ nozzleSize: nozzleSizeNum });
    
    const url = window.URL.createObjectURL(stlBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow_calibration_cube_${nozzleSize}mm.stl`;
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Calculator className="w-8 h-8" />
            Flow Rate Calibration
          </CardTitle>
          <CardDescription className="text-base">
            Precision flow rate calibration using dual-wall measurement cube
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="single" collapsible defaultValue="instructions" className="w-full">
        <AccordionItem value="instructions">
          <AccordionTrigger className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Calibration Instructions
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid md:grid-cols-2 gap-6 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">1. Prepare Your Print</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ul className="space-y-1">
                    <li>• Set line width to exactly {nozzleSize}mm</li>
                    <li>• Use 2 perimeters, 0% infill</li>
                    <li>• Set "Wall Generator" to Classic</li>
                    <li>• Disable "Detect thin walls"</li>
                    <li>• Set layer height to 0.2mm</li>
                    <li>• Print the calibration cube STL</li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">2. Measure & Calculate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ul className="space-y-1">
                    <li>• Measure the <strong>upper thin wall</strong> ({nozzleSize}mm target)</li>
                    <li>• Measure the <strong>lower thick wall</strong> ({(parseFloat(nozzleSize) * 3).toFixed(1)}mm target)</li>
                    <li>• Take measurements on all 4 sides</li>
                    <li>• Use calipers with 0.01mm precision</li>
                    <li>• Avoid measuring near corners</li>
                    <li>• Enter values below for automatic calculation</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Alert className="mt-4">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Pro Tip</AlertTitle>
              <AlertDescription>
                The calibration cube has a solid base (0.8mm), thick walls (1.2mm) in the lower section, 
                and thin walls (0.4mm) in the upper section. The thin wall will be printed with 2 perimeters for accurate flow testing.
              </AlertDescription>
            </Alert>

            <div className="mt-4 flex justify-center">
              <Button onClick={downloadSTL} variant="outline" className="flex items-center gap-2">
                <Box className="w-4 h-4" />
                Download STL for {nozzleSize}mm Nozzle
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Printer Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nozzle-size">Nozzle Size (mm)</Label>
              <Select value={nozzleSize} onValueChange={setNozzleSize}>
                <SelectTrigger id="nozzle-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.4">0.4mm (Standard)</SelectItem>
                  <SelectItem value="0.6">0.6mm</SelectItem>
                  <SelectItem value="0.8">0.8mm</SelectItem>
                  <SelectItem value="0.2">0.2mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current-flow">Current Flow Rate (%)</Label>
              <Input
                id="current-flow"
                type="number"
                value={currentFlow}
                onChange={(e) => setCurrentFlow(parseFloat(e.target.value) || 100)}
                placeholder="100"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Visual Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg border">
              <svg viewBox="0 0 200 200" className="w-full h-32">
                <rect x="20" y="20" width="160" height="160" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground"/>
                
                <rect x="20" y="20" width="160" height="80" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent))" strokeWidth="2"/>
                <text x="100" y="65" textAnchor="middle" className="text-sm font-semibold fill-accent-foreground">
                  Thick Wall ({(parseFloat(nozzleSize) * 3).toFixed(1)}mm)
                </text>
                
                <rect x="20" y="100" width="160" height="80" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2"/>
                <text x="100" y="145" textAnchor="middle" className="text-sm font-semibold fill-primary">
                  Thin Wall ({nozzleSize}mm)
                </text>
                
                <path d="M 10 60 L 15 60" stroke="hsl(var(--accent))" strokeWidth="2"/>
                <path d="M 185 60 L 190 60" stroke="hsl(var(--accent))" strokeWidth="2"/>
                <path d="M 10 140 L 15 140" stroke="hsl(var(--primary))" strokeWidth="2"/>
                <path d="M 185 140 L 190 140" stroke="hsl(var(--primary))" strokeWidth="2"/>
              </svg>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Measure wall thickness at marked locations
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Thin Wall Measurements (Upper Section)
            </CardTitle>
            <CardDescription>Target: {nozzleSize}mm (printed with 2 perimeters)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {singleWallMeasurements.map((value, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`single-${index}`}>Side {index + 1}</Label>
                  <Input
                    id={`single-${index}`}
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newMeasurements = [...singleWallMeasurements];
                      newMeasurements[index] = e.target.value;
                      setSingleWallMeasurements(newMeasurements);
                    }}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Thick Wall Measurements (Lower Section)
            </CardTitle>
            <CardDescription>Target: {(parseFloat(nozzleSize) * 3).toFixed(1)}mm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {doubleWallMeasurements.map((value, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`double-${index}`}>Side {index + 1}</Label>
                  <Input
                    id={`double-${index}`}
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newMeasurements = [...doubleWallMeasurements];
                      newMeasurements[index] = e.target.value;
                      setDoubleWallMeasurements(newMeasurements);
                    }}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={calculateFlowRate} 
          size="lg" 
          className="flex-1"
          disabled={singleWallMeasurements.every(m => !m) && doubleWallMeasurements.every(m => !m)}
        >
          <Calculator className="mr-2 h-5 w-5" />
          Calculate Flow Rate
        </Button>
        
        <Button onClick={resetCalculator} size="lg" variant="outline">
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>
      </div>

      {results && (
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
              <CheckCircle2 className="w-6 h-6" />
              Calibration Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {results.singleWallAvg && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Thin Wall Average</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.singleWallAvg.toFixed(3)}mm</p>
                    <p className="text-sm text-muted-foreground">Flow: {results.doubleFlowPercent?.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {results.doubleWallAvg && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Thick Wall Average</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.doubleWallAvg.toFixed(3)}mm</p>
                    <p className="text-sm text-muted-foreground">Flow: {results.singleFlowPercent?.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Combined Average</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{results.avgFlowPercent.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    Adjustment: {parseFloat(results.adjustment) > 0 ? '+' : ''}{results.adjustment}%
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <Alert className="bg-green-100 border-green-300 dark:bg-green-900/50">
              <AlertTitle className="text-lg">Set your Flow Rate in Orca Slicer to:</AlertTitle>
              <AlertDescription className="text-3xl font-bold text-green-900 dark:text-green-100">
                {results.newFlowRate}%
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-center">
            <Button onClick={exportResults} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </CardFooter>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            This tool uses the formula: <code className="bg-muted px-2 py-1 rounded text-xs">New Flow = Current Flow × (Expected / Measured)</code>
          </p>
          <p>
            The calibration cube tests flow in two ways: the lower section has thick walls (1.2mm) to test bulk extrusion, 
            while the upper section has thin walls (0.4mm, printed with 2 perimeters) to test precise thin wall printing. The algorithm averages both results for optimal accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrcaFlowCalibration;