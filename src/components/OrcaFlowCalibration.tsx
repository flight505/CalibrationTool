import { useState } from 'react';
import { Calculator, Ruler, Download, RotateCcw, Info, CheckCircle2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CalibrationResults {
  singleWallAvg: number | null;
  tripleWallAvg: number | null;
  singleFlowPercent: number | null;
  tripleFlowPercent: number | null;
  avgFlowPercent: number;
  newFlowRate: string;
  adjustment: string;
}

const OrcaFlowCalibration = () => {
  const [nozzleSize, setNozzleSize] = useState('0.4');
  const [currentFlow, setCurrentFlow] = useState(100);
  const [singleWallMeasurements, setSingleWallMeasurements] = useState(['', '', '', '']);
  const [tripleWallMeasurements, setTripleWallMeasurements] = useState(['', '', '', '']);
  const [results, setResults] = useState<CalibrationResults | null>(null);

  const calculateFlowRate = () => {
    const validSingle = singleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));
    const validTriple = tripleWallMeasurements.filter(m => m && !isNaN(parseFloat(m))).map(m => parseFloat(m));

    if (validSingle.length === 0 && validTriple.length === 0) {
      return;
    }

    const singleAvg = validSingle.length > 0 
      ? validSingle.reduce((a, b) => a + b, 0) / validSingle.length 
      : null;
    
    const tripleAvg = validTriple.length > 0 
      ? validTriple.reduce((a, b) => a + b, 0) / validTriple.length 
      : null;

    const nozzleSizeNum = parseFloat(nozzleSize);
    const singleFlowPercent = singleAvg ? (nozzleSizeNum / singleAvg) * 100 : null;
    const tripleFlowPercent = tripleAvg ? ((nozzleSizeNum * 3) / tripleAvg) * 100 : null;

    let avgFlowPercent;
    if (singleFlowPercent && tripleFlowPercent) {
      avgFlowPercent = (singleFlowPercent + tripleFlowPercent) / 2;
    } else {
      avgFlowPercent = singleFlowPercent || tripleFlowPercent || 100;
    }

    const newFlowRate = (currentFlow * avgFlowPercent) / 100;

    setResults({
      singleWallAvg: singleAvg,
      tripleWallAvg: tripleAvg,
      singleFlowPercent,
      tripleFlowPercent,
      avgFlowPercent,
      newFlowRate: newFlowRate.toFixed(2),
      adjustment: ((avgFlowPercent - 100)).toFixed(2)
    });
  };

  const resetCalculator = () => {
    setSingleWallMeasurements(['', '', '', '']);
    setTripleWallMeasurements(['', '', '', '']);
    setResults(null);
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = `Orca Slicer Flow Calibration Results
=====================================
Date: ${new Date().toLocaleString()}
Nozzle Size: ${nozzleSize}mm
Current Flow Rate: ${currentFlow}%

Single Wall Measurements: ${singleWallMeasurements.filter(m => m).join(', ')}mm
Single Wall Average: ${results.singleWallAvg?.toFixed(3) || 'N/A'}mm
Single Wall Flow %: ${results.singleFlowPercent?.toFixed(2) || 'N/A'}%

Triple Wall Measurements: ${tripleWallMeasurements.filter(m => m).join(', ')}mm
Triple Wall Average: ${results.tripleWallAvg?.toFixed(3) || 'N/A'}mm
Triple Wall Flow %: ${results.tripleFlowPercent?.toFixed(2) || 'N/A'}%

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
                    <li>• Measure the <strong>upper single wall</strong> (0.4mm target)</li>
                    <li>• Measure the <strong>lower triple wall</strong> (1.2mm target)</li>
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
                The dual-wall design provides better accuracy by testing both thin and thick wall extrusion in a single print. 
                The algorithm averages both measurements for optimal results.
              </AlertDescription>
            </Alert>
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
                
                <rect x="20" y="20" width="160" height="60" fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="2"/>
                <text x="100" y="55" textAnchor="middle" className="text-sm font-semibold fill-primary">
                  Single Wall ({nozzleSize}mm)
                </text>
                
                <rect x="20" y="80" width="160" height="100" fill="hsl(var(--accent) / 0.1)" stroke="hsl(var(--accent))" strokeWidth="2"/>
                <text x="100" y="135" textAnchor="middle" className="text-sm font-semibold fill-accent-foreground">
                  Triple Wall ({(parseFloat(nozzleSize) * 3).toFixed(1)}mm)
                </text>
                
                <path d="M 10 50 L 15 50" stroke="hsl(var(--primary))" strokeWidth="2"/>
                <path d="M 185 50 L 190 50" stroke="hsl(var(--primary))" strokeWidth="2"/>
                <path d="M 10 130 L 15 130" stroke="hsl(var(--accent))" strokeWidth="2"/>
                <path d="M 185 130 L 190 130" stroke="hsl(var(--accent))" strokeWidth="2"/>
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
              Single Wall Measurements
            </CardTitle>
            <CardDescription>Target: {nozzleSize}mm</CardDescription>
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
              Triple Wall Measurements
            </CardTitle>
            <CardDescription>Target: {(parseFloat(nozzleSize) * 3).toFixed(1)}mm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {tripleWallMeasurements.map((value, index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`triple-${index}`}>Side {index + 1}</Label>
                  <Input
                    id={`triple-${index}`}
                    type="number"
                    step="0.01"
                    value={value}
                    onChange={(e) => {
                      const newMeasurements = [...tripleWallMeasurements];
                      newMeasurements[index] = e.target.value;
                      setTripleWallMeasurements(newMeasurements);
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
          disabled={singleWallMeasurements.every(m => !m) && tripleWallMeasurements.every(m => !m)}
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
                    <CardDescription>Single Wall Average</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.singleWallAvg.toFixed(3)}mm</p>
                    <p className="text-sm text-muted-foreground">Flow: {results.singleFlowPercent?.toFixed(1)}%</p>
                  </CardContent>
                </Card>
              )}
              
              {results.tripleWallAvg && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Triple Wall Average</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{results.tripleWallAvg.toFixed(3)}mm</p>
                    <p className="text-sm text-muted-foreground">Flow: {results.tripleFlowPercent?.toFixed(1)}%</p>
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
            The dual-wall cube design provides two independent measurements: single walls test fine extrusion control, 
            while triple walls verify consistency at higher volumes. The algorithm averages both results for optimal accuracy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrcaFlowCalibration;