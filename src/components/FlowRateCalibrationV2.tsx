import { useState } from 'react';
import { Calculator, Ruler, Download, Box, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateFlowCalibrationCubeFromTemplate } from '@/utils/stlGenerator';
import {
  CalibrationToolLayout,
  FormSection,
  InfoCard,
  ActionSection,
  ResultCard,
  TwoColumnLayout,
} from '@/components/calibration/CalibrationToolLayout';
import {
  TextField,
  SelectField,
  FieldGroup,
} from '@/components/calibration/FormFields';

interface FlowRateCalibrationProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FlowRateCalibrationV2: React.FC<FlowRateCalibrationProps> = ({ onNavigate }) => {
  // Cube method states
  const [nozzleSize, setNozzleSize] = useState('0.4');
  const [currentFlow, setCurrentFlow] = useState('1.00');
  const [singleWallMeasurements, setSingleWallMeasurements] = useState(['', '', '', '']);
  const [doubleWallMeasurements, setDoubleWallMeasurements] = useState(['', '', '', '']);
  const [cubeResult, setCubeResult] = useState<{ newFlowRatio: string; avgFlowPercent: number; adjustment: string } | null>(null);

  // YOLO method states
  const [yoloCurrentFlow, setYoloCurrentFlow] = useState('0.98');
  const [modifier, setModifier] = useState('0.04');
  const [yoloResult, setYoloResult] = useState<string | null>(null);

  const nozzleOptions = [
    { value: '0.4', label: '0.4mm (Standard)' },
    { value: '0.6', label: '0.6mm' },
    { value: '0.8', label: '0.8mm' },
    { value: '0.2', label: '0.2mm' },
  ];

  const calculateCubeFlow = () => {
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
    const thinFlowPercent = singleAvg ? (nozzleSizeNum / singleAvg) * 100 : null;
    const thickFlowPercent = doubleAvg ? ((nozzleSizeNum * 3) / doubleAvg) * 100 : null;

    let avgFlowPercent;
    if (thickFlowPercent && thinFlowPercent) {
      avgFlowPercent = (thickFlowPercent + thinFlowPercent) / 2;
    } else {
      avgFlowPercent = thickFlowPercent || thinFlowPercent || 100;
    }

    // Auto-detect format
    let currentFlowNum = parseFloat(currentFlow) || 1.00;
    if (currentFlowNum > 10) {
      currentFlowNum = currentFlowNum / 100;
    }
    const newFlowRatio = (currentFlowNum * avgFlowPercent) / 100;

    setCubeResult({
      newFlowRatio: newFlowRatio.toFixed(3),
      avgFlowPercent,
      adjustment: ((avgFlowPercent - 100)).toFixed(2)
    });
  };

  const calculateYoloFlow = () => {
    let currentFlowNum = parseFloat(yoloCurrentFlow);
    if (currentFlowNum > 10) {
      currentFlowNum = currentFlowNum / 100;
    }
    const modifierNum = parseFloat(modifier) || 0;
    const newFlowRatio = currentFlowNum + modifierNum;
    setYoloResult(newFlowRatio.toFixed(3));
  };

  const downloadSTL = async () => {
    const nozzleSizeNum = parseFloat(nozzleSize);
    try {
      const stlBlob = await generateFlowCalibrationCubeFromTemplate({ nozzleSize: nozzleSizeNum });

      const url = URL.createObjectURL(stlBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow_calibration_cube_${nozzleSize}mm.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate STL:', error);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="tip" title="Setting Location">
        <p className="text-xs font-medium mb-1">Flow Ratio is found in:</p>
        <p className="text-xs">Material settings → Filament → Flow ratio</p>
      </InfoCard>

      <InfoCard variant="info" title="Method Comparison">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-xs">Cube Method:</p>
            <p className="text-xs">Most accurate, requires calipers</p>
          </div>
          <div>
            <p className="font-medium text-xs">YOLO Mode:</p>
            <p className="text-xs">Quick visual method for fine-tuning</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard variant="warning" title="Print Settings">
        <ul className="space-y-1 text-xs">
          <li>• Line Width: {nozzleSize}mm</li>
          <li>• Wall Loops: 2</li>
          <li>• Infill: 0%</li>
          <li>• Layer Height: 0.2mm</li>
          <li>• Detect Thin Walls: Enabled</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Measurement Tips">
        <ul className="space-y-1 text-xs">
          <li>• Measure all 4 sides</li>
          <li>• Avoid corners</li>
          <li>• Use 0.01mm precision calipers</li>
          <li>• Upper section: {nozzleSize}mm target</li>
          <li>• Lower section: {(parseFloat(nozzleSize) * 3).toFixed(1)}mm target</li>
        </ul>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Calculator className="w-6 h-6" />}
      title="Flow Ratio Calibration"
      description="Precision flow calibration using measurement or visual methods"
      docPath="/docs/orca-slicer/calibration/flow-rate-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Critical', variant: 'destructive' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="cube" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-lg">
            <TabsTrigger value="cube" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Cube Method
            </TabsTrigger>
            <TabsTrigger value="yolo" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              YOLO Mode
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cube" className="space-y-4">
            <FormSection
              title="Calibration Cube Setup"
              description="Configure and download your calibration cube"
              icon={<Box className="h-4 w-4" />}
            >
              <FieldGroup>
                <SelectField
                  label="Nozzle Size"
                  id="nozzle-size"
                  value={nozzleSize}
                  onChange={setNozzleSize}
                  options={nozzleOptions}
                />
                <TextField
                  label="Current Flow Ratio"
                  id="current-flow"
                  value={currentFlow}
                  onChange={setCurrentFlow}
                  placeholder="1.00"
                  helperText="Enter as decimal (e.g., 0.98 not 98%)"
                />
              </FieldGroup>

              {parseFloat(currentFlow) > 10 && (
                <InfoCard variant="warning">
                  Auto-converting {currentFlow} to {(parseFloat(currentFlow) / 100).toFixed(3)} (percentage → decimal)
                </InfoCard>
              )}

              <ActionSection>
                <Button onClick={downloadSTL} variant="outline" className="w-full sm:w-auto">
                  <Download className="mr-2 h-4 w-4" />
                  Download Calibration Cube
                </Button>
              </ActionSection>
            </FormSection>

            <FormSection
              title="Wall Measurements"
              description="Measure the printed cube walls with calipers"
              icon={<Ruler className="h-4 w-4" />}
            >
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-3">Thin Wall (Upper) - Target: {nozzleSize}mm</p>
                  <div className="grid grid-cols-2 gap-3">
                    {singleWallMeasurements.map((value, index) => (
                      <TextField
                        key={`single-${index}`}
                        label={`Side ${index + 1}`}
                        id={`single-${index}`}
                        type="number"
                        value={value}
                        onChange={(v) => {
                          const newMeasurements = [...singleWallMeasurements];
                          newMeasurements[index] = v;
                          setSingleWallMeasurements(newMeasurements);
                        }}
                        step={0.01}
                        unit="mm"
                        placeholder="0.00"
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-3">Thick Wall (Lower) - Target: {(parseFloat(nozzleSize) * 3).toFixed(1)}mm</p>
                  <div className="grid grid-cols-2 gap-3">
                    {doubleWallMeasurements.map((value, index) => (
                      <TextField
                        key={`double-${index}`}
                        label={`Side ${index + 1}`}
                        id={`double-${index}`}
                        type="number"
                        value={value}
                        onChange={(v) => {
                          const newMeasurements = [...doubleWallMeasurements];
                          newMeasurements[index] = v;
                          setDoubleWallMeasurements(newMeasurements);
                        }}
                        step={0.01}
                        unit="mm"
                        placeholder="0.00"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <ActionSection>
                <Button
                  onClick={calculateCubeFlow}
                  className="w-full sm:w-auto"
                  disabled={singleWallMeasurements.every(m => !m) && doubleWallMeasurements.every(m => !m)}
                >
                  Calculate Flow Ratio
                </Button>
              </ActionSection>

              {cubeResult && (
                <ResultCard
                  title="New Flow Ratio"
                  value={cubeResult.newFlowRatio}
                  description={`Flow: ${cubeResult.avgFlowPercent.toFixed(1)}% | Adjustment: ${parseFloat(cubeResult.adjustment) > 0 ? '+' : ''}${cubeResult.adjustment}%`}
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="yolo" className="space-y-4">
            <FormSection
              title="YOLO Mode Calculator"
              description="Quick flow adjustment using visual test pattern"
              icon={<Zap className="h-4 w-4" />}
            >
              <InfoCard variant="info">
                YOLO mode simplifies flow calibration by using direct addition instead of percentages.
                Print the test pattern, select the best looking block (-0.04 to +0.04), and add that modifier to your current flow ratio.
              </InfoCard>

              <FieldGroup>
                <TextField
                  label="Current Flow Ratio"
                  id="yolo-current-flow"
                  type="number"
                  value={yoloCurrentFlow}
                  onChange={setYoloCurrentFlow}
                  step={0.01}
                  placeholder="0.98"
                  helperText="Enter as decimal (e.g., 0.98 not 98%)"
                />
                <TextField
                  label="Modifier"
                  id="modifier"
                  type="number"
                  value={modifier}
                  onChange={setModifier}
                  step={0.01}
                  placeholder="0.04"
                  helperText="From -0.04 to +0.04 based on test pattern"
                />
              </FieldGroup>

              {parseFloat(yoloCurrentFlow) > 10 && (
                <InfoCard variant="warning">
                  Auto-converting {yoloCurrentFlow} to {(parseFloat(yoloCurrentFlow) / 100).toFixed(3)} (percentage → decimal)
                </InfoCard>
              )}

              <ActionSection>
                <Button onClick={calculateYoloFlow} className="w-full sm:w-auto">
                  Calculate New Flow Ratio
                </Button>
              </ActionSection>

              {yoloResult && (
                <ResultCard
                  title="New Flow Ratio"
                  value={yoloResult}
                  description="Apply this value in Material settings → Filament → Flow ratio"
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>

            <FormSection
              title="Quick Reference"
              icon={<Zap className="h-4 w-4" />}
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-400">•</span>
                  <p><strong>Smoothest surface</strong> = correct flow</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 dark:text-amber-400">•</span>
                  <p><strong>Gaps between lines</strong> = increase modifier</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400">•</span>
                  <p><strong>Over-extrusion ridges</strong> = decrease modifier</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 dark:text-blue-400">•</span>
                  <p><strong>Test duration</strong> = only 10 minutes</p>
                </div>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default FlowRateCalibrationV2;