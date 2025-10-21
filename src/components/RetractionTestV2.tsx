import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Download, Package, Calculator, CheckCircle2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateRetractionTestTower } from '@/utils/stlGenerator';
import { generateRetractionTower3MF } from '@/utils/orcaRetractionTower';
import type { FirmwareType } from '@/utils/postProcessingGenerator';
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
  SwitchField,
  FieldGroup,
} from '@/components/calibration/FormFields';

interface RetractionTestProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const RetractionTestV2: React.FC<RetractionTestProps> = ({ onNavigate }) => {
  const [extruderType, setExtruderType] = useState('Direct Drive');

  // Calculator states
  const [start, setStart] = useState('0');
  const [measuredHeight, setMeasuredHeight] = useState('15');
  const [factor, setFactor] = useState('0.1');
  const [result, setResult] = useState<string | null>(null);

  // STL Generation states
  const [stlStartRetraction, setStlStartRetraction] = useState('0');
  const [stlEndRetraction, setStlEndRetraction] = useState('2');
  const [stlRetractionStep, setStlRetractionStep] = useState('0.1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [firmware, setFirmware] = useState<FirmwareType>('marlin');
  const [useNativeModifiers, setUseNativeModifiers] = useState(firmware === 'orcaslicer');

  const extruderOptions = [
    { value: 'Direct Drive', label: 'Direct Drive' },
    { value: 'Bowden', label: 'Bowden' },
  ];

  const firmwareOptions = [
    { value: 'marlin', label: 'Marlin' },
    { value: 'klipper', label: 'Klipper' },
    { value: 'reprap', label: 'RepRapFirmware' },
    { value: 'orcaslicer', label: 'OrcaSlicer (Native)' },
  ];

  const materialRecommendations: Record<string, Record<string, { start: number; end: number; optimal: string }>> = {
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

  useEffect(() => {
    setStlStartRetraction(extruderType === 'Direct Drive' ? '0' : '1');
    setStlEndRetraction(extruderType === 'Direct Drive' ? '2' : '6');
    setStlRetractionStep(extruderType === 'Direct Drive' ? '0.1' : '0.2');
  }, [extruderType]);

  const calculate = () => {
    const s = parseFloat(start) || 0;
    const h = parseFloat(measuredHeight) || 0;
    const f = parseFloat(factor) || 0;
    const retractionLength = s + (h * f);
    setResult(retractionLength.toFixed(5));
  };

  const generateSTL = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateRetractionTestTower({
        startRetraction: parseFloat(stlStartRetraction),
        endRetraction: parseFloat(stlEndRetraction),
        retractionStep: parseFloat(stlRetractionStep)
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

  const generate3MF = async () => {
    setIsGenerating(true);
    try {
      const extruderTypeMap: Record<string, 'direct_drive' | 'bowden'> = {
        'Direct Drive': 'direct_drive',
        'Bowden': 'bowden'
      };

      const project = await generateRetractionTower3MF(
        {
          startValue: parseFloat(stlStartRetraction),
          endValue: parseFloat(stlEndRetraction),
          stepSize: parseFloat(stlRetractionStep),
          extruderType: extruderTypeMap[extruderType] || 'direct_drive',
          retractionSpeed: 30
        },
        firmware,
        !useNativeModifiers
      );

      const url = URL.createObjectURL(project.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = project.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate 3MF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const towerHeight = 1.0 + ((parseFloat(stlEndRetraction) - parseFloat(stlStartRetraction)) / parseFloat(stlRetractionStep));
  const testSections = Math.floor((parseFloat(stlEndRetraction) - parseFloat(stlStartRetraction)) / parseFloat(stlRetractionStep)) + 1;

  // Sidebar content
  const previousFirmware = useRef(firmware);

  useEffect(() => {
    if (firmware === 'orcaslicer' && previousFirmware.current !== 'orcaslicer') {
      setUseNativeModifiers(true);
    }
    if (firmware !== 'orcaslicer' && previousFirmware.current === 'orcaslicer') {
      setUseNativeModifiers(false);
    }
    previousFirmware.current = firmware;
  }, [firmware]);

  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="tip" title={`${extruderType} Ranges`}>
        <ul className="space-y-1 text-xs">
          {Object.entries(materialRecommendations[extruderType]).map(([mat, rec]) => (
            <li key={mat}>
              <strong>{mat}:</strong> {rec.optimal}mm
            </li>
          ))}
        </ul>
      </InfoCard>

      <InfoCard variant="info" title="What to Look For">
        <ul className="space-y-1 text-xs">
          <li>• No stringing between towers</li>
          <li>• Clean travel moves</li>
          <li>• No oozing during moves</li>
          <li>• Good restart quality</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Retraction Speed">
        <ul className="space-y-1 text-xs">
          <li>• Typical: 40-60mm/s</li>
          <li>• Too fast: Filament grinding</li>
          <li>• Too slow: Ineffective</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Z-Hop Options">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Normal:</strong> Straight vertical</li>
          <li>• <strong>Slope:</strong> Diagonal movement</li>
          <li>• <strong>Spiral:</strong> Circular pattern</li>
          <li>• Typical: 0.2-0.4mm</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="Pro Tip">
        <p className="text-xs">
          Less retraction is often better. Find the minimum that eliminates stringing
          to avoid clogs and heat creep.
        </p>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<RotateCcw className="w-6 h-6" />}
      title="Retraction Test Manager"
      description="Optimize retraction settings to eliminate stringing"
      docPath="/docs/orca-slicer/calibration/retraction-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Important', variant: 'default' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="generate">Generate Tower</TabsTrigger>
            <TabsTrigger value="calculate">Calculate</TabsTrigger>
            <TabsTrigger value="reference">Reference</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <FormSection
              title="Tower Configuration"
              description="Create a parametric retraction test tower"
              icon={<Printer className="h-4 w-4" />}
            >
              <SelectField
                label="Extruder Type"
                id="extruder-type"
                value={extruderType}
                onChange={setExtruderType}
                options={extruderOptions}
              />

              <FieldGroup>
                <TextField
                  label="Start Retraction"
                  id="stl-start"
                  type="number"
                  value={stlStartRetraction}
                  onChange={setStlStartRetraction}
                  step={0.5}
                  unit="mm"
                  placeholder={extruderType === 'Direct Drive' ? '0' : '1'}
                  helperText={`Typical: ${extruderType === 'Direct Drive' ? '0mm' : '1mm'}`}
                />
                <TextField
                  label="End Retraction"
                  id="stl-end"
                  type="number"
                  value={stlEndRetraction}
                  onChange={setStlEndRetraction}
                  step={0.5}
                  unit="mm"
                  placeholder={extruderType === 'Direct Drive' ? '2' : '6'}
                  helperText={`Typical: ${extruderType === 'Direct Drive' ? '2mm' : '6mm'}`}
                />
              </FieldGroup>

              <TextField
                label="Step Size"
                id="stl-step"
                type="number"
                value={stlRetractionStep}
                onChange={setStlRetractionStep}
                step={0.05}
                unit="mm"
                placeholder="0.1"
                helperText={`Typical: ${extruderType === 'Direct Drive' ? '0.1mm' : '0.2mm'}`}
              />

              <InfoCard variant="info">
                <div className="space-y-1 text-xs">
                  <div><strong>Tower Height:</strong> {towerHeight.toFixed(1)}mm</div>
                  <div><strong>Test Sections:</strong> {testSections}</div>
                  <div><strong>Tower Config:</strong> 4 towers (~3mm diameter each)</div>
                  <div><strong>Base Plate:</strong> 40×15×0.4mm</div>
                </div>
              </InfoCard>

              <SelectField
                label="Firmware Type"
                id="firmware"
                value={firmware}
                onChange={(v) => setFirmware(v as FirmwareType)}
                options={firmwareOptions}
                helperText="Select your printer's firmware for proper G-code generation"
              />

              <SwitchField
                label="Use Orca native modifiers"
                id="native-modifiers"
                checked={useNativeModifiers}
                onCheckedChange={setUseNativeModifiers}
                description="Recommended when slicing in OrcaSlicer; disables firmware G-code overrides"
              />

              <ActionSection>
                <Button
                  onClick={generateSTL}
                  variant="outline"
                  disabled={isGenerating || parseFloat(stlRetractionStep) <= 0 || parseFloat(stlEndRetraction) <= parseFloat(stlStartRetraction)}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Download STL'}
                </Button>

                <Button
                  onClick={generate3MF}
                  disabled={isGenerating || parseFloat(stlRetractionStep) <= 0 || parseFloat(stlEndRetraction) <= parseFloat(stlStartRetraction)}
                  className="w-full sm:w-auto"
                >
                  <Package className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : '3MF Project'}
                </Button>
              </ActionSection>

              <InfoCard variant="warning">
                <strong>Remember these values!</strong> You'll need them in the Calculate tab to find your optimal retraction.
              </InfoCard>
            </FormSection>
          </TabsContent>

          <TabsContent value="calculate" className="space-y-4">
            <FormSection
              title="Calculate Optimal Retraction"
              description="Find your optimal retraction value from test results"
              icon={<Calculator className="h-4 w-4" />}
            >
              <InfoCard variant="info">
                <p className="text-xs mb-2"><strong>Example:</strong> If you used Start: 0mm, Step: 0.1mm in the tower, and the cleanest section is at 15mm height:</p>
                <div className="font-mono text-center text-xs">
                  0mm + (15mm × 0.1mm) = <strong>1.5mm retraction</strong>
                </div>
              </InfoCard>

              <FieldGroup>
                <TextField
                  label="Start Retraction"
                  id="start"
                  type="number"
                  value={start}
                  onChange={setStart}
                  step={0.1}
                  unit="mm"
                  placeholder="0"
                  helperText="The start value from your tower"
                />
                <TextField
                  label="Measured Height"
                  id="measured-height"
                  type="number"
                  value={measuredHeight}
                  onChange={setMeasuredHeight}
                  unit="mm"
                  placeholder="15"
                  helperText="Where stringing stops on tower"
                />
              </FieldGroup>

              <TextField
                label="Step Size"
                id="factor"
                type="number"
                value={factor}
                onChange={setFactor}
                step={0.01}
                unit="mm"
                placeholder="0.1"
                helperText="The step size from your tower"
              />

              {(start !== '0' || measuredHeight !== '0' || factor !== '0') && (
                <InfoCard variant="default">
                  <p className="font-mono text-center text-sm">
                    {start}mm + ({measuredHeight}mm × {factor}mm) = <strong>{(parseFloat(start) + (parseFloat(measuredHeight) * parseFloat(factor))).toFixed(5)}mm</strong>
                  </p>
                </InfoCard>
              )}

              <ActionSection>
                <Button onClick={calculate} className="w-full sm:w-auto">
                  Calculate Retraction Length
                </Button>
              </ActionSection>

              {result && (
                <ResultCard
                  title="Optimal Retraction Length"
                  value={`${result}mm`}
                  description="Enter in: Filament Settings → Setting Overrides → Retraction Length"
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="reference" className="space-y-4">
            <FormSection
              title="Height Reference Guide"
              description={`${testSections} test layers for your current configuration`}
              icon={<RotateCcw className="h-4 w-4" />}
            >
              <InfoCard variant="info">
                Each layer tests a different retraction value. Find the cleanest layer and note its height.
              </InfoCard>

              <div className="space-y-1 text-sm max-h-64 overflow-y-auto bg-muted/50 p-3 rounded-lg">
                <div className="font-mono sticky top-0 bg-background/95 backdrop-blur-sm py-1 font-semibold">
                  Base: 0.0 - 1.0mm (no retraction)
                </div>
                {Array.from({ length: testSections }, (_, i) => {
                  const retraction = parseFloat(stlStartRetraction) + (i * parseFloat(stlRetractionStep));
                  const layerHeight = 1.0 + i;
                  return (
                    <div key={i} className="font-mono hover:bg-muted px-1 rounded">
                      Height {layerHeight.toFixed(1)}mm → {retraction.toFixed(2)}mm retraction
                    </div>
                  );
                })}
              </div>
            </FormSection>

            <FormSection
              title="Material Recommendations"
              icon={<Package className="h-4 w-4" />}
            >
              <div className="grid gap-2">
                {['PLA', 'ABS', 'PETG', 'TPU', 'Nylon'].map((material) => {
                  const rec = materialRecommendations[extruderType][material];
                  return (
                    <div key={material} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                      <span className="font-medium text-sm">{material}:</span>
                      <div className="text-sm text-right">
                        <span className="text-muted-foreground">Test: {rec.start}-{rec.end}mm</span>
                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">Best: {rec.optimal}mm</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {extruderType === 'Direct Drive' ?
                  'Direct drive systems need minimal retraction to prevent clogs' :
                  'Bowden systems require more retraction due to tube length'}
              </p>
            </FormSection>
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default RetractionTestV2;
