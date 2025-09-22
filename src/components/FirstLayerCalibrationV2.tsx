import { useState } from 'react';
import { Layers, Download, Calculator, Wrench, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateFirstLayerCalibration } from '@/utils/stlGenerator';
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
  Fieldset,
} from '@/components/calibration/FormFields';

interface FirstLayerCalibrationProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FirstLayerCalibrationV2: React.FC<FirstLayerCalibrationProps> = ({ onNavigate }) => {
  // State management
  const [material, setMaterial] = useState('PLA');
  const [currentZOffset, setCurrentZOffset] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [bedTemp, setBedTemp] = useState('60');
  const [nozzleTemp, setNozzleTemp] = useState('210');
  const [result, setResult] = useState<{ value: string; description: string } | null>(null);

  // Pattern generator states
  const [useCustomSize, setUseCustomSize] = useState(false);
  const [plateWidth, setPlateWidth] = useState('220');
  const [plateLength, setPlateLength] = useState('220');
  const [plateShape, setPlateShape] = useState<'rectangular' | 'circular'>('rectangular');
  const [patchSpacing, setPatchSpacing] = useState('5');
  const [isGenerating, setIsGenerating] = useState(false);

  const materialOptions = [
    { value: 'PLA', label: 'PLA' },
    { value: 'PETG', label: 'PETG' },
    { value: 'ABS', label: 'ABS' },
    { value: 'TPU', label: 'TPU' },
    { value: 'PA-CF', label: 'PA-CF' },
  ];

  const materialSettings = {
    PLA: { bedTemp: 60, nozzleTemp: 210, squish: 'moderate' },
    PETG: { bedTemp: 80, nozzleTemp: 240, squish: 'light' },
    ABS: { bedTemp: 100, nozzleTemp: 255, squish: 'moderate' },
    TPU: { bedTemp: 50, nozzleTemp: 225, squish: 'heavy' },
    'PA-CF': { bedTemp: 100, nozzleTemp: 300, squish: 'light' },
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    const settings = materialSettings[newMaterial as keyof typeof materialSettings];
    setBedTemp(settings.bedTemp.toString());
    setNozzleTemp(settings.nozzleTemp.toString());
  };

  const calculateNewOffset = () => {
    const current = parseFloat(currentZOffset) || 0;
    const adj = parseFloat(adjustment) || 0;
    const newOffset = current + adj;

    setResult({
      value: `${newOffset.toFixed(3)}mm`,
      description: 'Save this value in your printer settings or start G-code'
    });
  };

  const downloadSTL = () => {
    const link = document.createElement('a');
    link.href = '/templates/first_layer_calibration.stl';
    link.download = 'First_Layer_Calibration.stl';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateCustomSTL = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateFirstLayerCalibration({
        plateWidth: parseFloat(plateWidth),
        plateLength: parseFloat(plateLength),
        plateShape,
        patchSpacing: parseFloat(patchSpacing)
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `first_layer_${plateShape}_${plateWidth}x${plateLength}mm.stl`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate custom STL:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="tip" title="Critical Settings">
        <p className="mb-2">Must set infill angle to 0° (horizontal) in your slicer:</p>
        <ul className="space-y-1 text-xs">
          <li>• OrcaSlicer: Quality → Bottom surface pattern → Monotonic</li>
          <li>• Set solid infill direction to 0°</li>
        </ul>
      </InfoCard>

      <InfoCard variant="info" title="What to Look For">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-xs">Too High (Far):</p>
            <p className="text-xs">Lines don't stick, gaps visible, round cross-section</p>
          </div>
          <div>
            <p className="font-medium text-xs">Just Right:</p>
            <p className="text-xs">Lines touch perfectly, slight squish, smooth surface</p>
          </div>
          <div>
            <p className="font-medium text-xs">Too Low (Close):</p>
            <p className="text-xs">Transparent lines, nozzle scraping, ridges</p>
          </div>
        </div>
      </InfoCard>

      <InfoCard variant="warning" title="Common Issues">
        <ul className="space-y-1 text-xs">
          <li>• Bed contamination - clean thoroughly</li>
          <li>• Wrong temperature - match material</li>
          <li>• Uneven bed - run auto-level</li>
          <li>• Draft exposure - use enclosure</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Pro Tips">
        <ul className="space-y-1 text-xs">
          <li>• Mark Z-offset values on print with marker</li>
          <li>• Print at 50% speed for easier observation</li>
          <li>• Different surfaces need different offsets</li>
          <li>• Clean between attempts for consistency</li>
        </ul>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Layers className="w-6 h-6" />}
      title="First Layer Calibration"
      description="Achieve perfect bed adhesion with proper Z-offset calibration"
      docPath="/docs/orca-slicer/calibration/first-layer-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Start Here', variant: 'default' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="calculator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="guide">Guide</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-4">
            <FormSection
              title="Test Parameters"
              description="Configure your test print settings"
              icon={<Wrench className="h-4 w-4" />}
            >
              <FieldGroup>
                <SelectField
                  label="Material"
                  id="material"
                  value={material}
                  onChange={handleMaterialChange}
                  options={materialOptions}
                />
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Bed Temp"
                    id="bed-temp"
                    type="number"
                    value={bedTemp}
                    onChange={setBedTemp}
                    unit="°C"
                    placeholder="60"
                  />
                  <TextField
                    label="Nozzle Temp"
                    id="nozzle-temp"
                    type="number"
                    value={nozzleTemp}
                    onChange={setNozzleTemp}
                    unit="°C"
                    placeholder="210"
                  />
                </div>
              </FieldGroup>

              <ActionSection>
                <Button onClick={downloadSTL} variant="outline" className="w-full sm:w-auto">
                  <Download className="w-4 h-4 mr-2" />
                  Download Test Pattern
                </Button>
              </ActionSection>
            </FormSection>

            <FormSection
              title="Z-Offset Calculator"
              description="Calculate your new permanent Z-offset"
              icon={<Calculator className="h-4 w-4" />}
            >
              <FieldGroup>
                <TextField
                  label="Current Z-Offset"
                  id="current-offset"
                  type="number"
                  value={currentZOffset}
                  onChange={setCurrentZOffset}
                  step={0.01}
                  unit="mm"
                  placeholder="-1.25"
                  helperText="Your printer's current Z-offset value"
                />
                <TextField
                  label="Baby Step Adjustment"
                  id="adjustment"
                  type="number"
                  value={adjustment}
                  onChange={setAdjustment}
                  step={0.01}
                  unit="mm"
                  placeholder="-0.05"
                  helperText="Negative = closer, Positive = farther"
                />
              </FieldGroup>

              <ActionSection>
                <Button onClick={calculateNewOffset} className="w-full sm:w-auto">
                  Calculate New Offset
                </Button>
              </ActionSection>

              {result && (
                <ResultCard
                  title="New Z-Offset"
                  value={result.value}
                  description={result.description}
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="generator" className="space-y-4">
            <FormSection
              title="Custom Pattern Generator"
              description="Generate a calibration pattern for your build plate"
              icon={<Wrench className="h-4 w-4" />}
            >
              <SwitchField
                label="Enable custom plate size"
                id="custom-size"
                checked={useCustomSize}
                onCheckedChange={setUseCustomSize}
                description="Generate pattern for your specific build plate"
              />

              {useCustomSize && (
                <>
                  <SelectField
                    label="Plate Shape"
                    id="plate-shape"
                    value={plateShape}
                    onChange={(value) => setPlateShape(value as 'rectangular' | 'circular')}
                    options={[
                      { value: 'rectangular', label: 'Rectangular' },
                      { value: 'circular', label: 'Circular' }
                    ]}
                  />

                  {plateShape === 'rectangular' ? (
                    <FieldGroup>
                      <TextField
                        label="Plate Width"
                        id="plate-width"
                        type="number"
                        value={plateWidth}
                        onChange={setPlateWidth}
                        unit="mm"
                        placeholder="220"
                      />
                      <TextField
                        label="Plate Length"
                        id="plate-length"
                        type="number"
                        value={plateLength}
                        onChange={setPlateLength}
                        unit="mm"
                        placeholder="220"
                      />
                    </FieldGroup>
                  ) : (
                    <TextField
                      label="Plate Diameter"
                      id="plate-diameter"
                      type="number"
                      value={plateWidth}
                      onChange={(value) => {
                        setPlateWidth(value);
                        setPlateLength(value);
                      }}
                      unit="mm"
                      placeholder="200"
                    />
                  )}

                  <TextField
                    label="Patch Spacing"
                    id="patch-spacing"
                    type="number"
                    value={patchSpacing}
                    onChange={setPatchSpacing}
                    unit="mm"
                    placeholder="5"
                    helperText="Distance between test patches"
                  />

                  <InfoCard variant="info">
                    {plateShape === 'rectangular'
                      ? `Will generate a grid pattern covering ${plateWidth}×${plateLength}mm`
                      : `Will generate concentric rings within ${plateWidth}mm diameter`
                    }
                  </InfoCard>

                  <ActionSection>
                    <Button
                      onClick={generateCustomSTL}
                      variant="outline"
                      disabled={isGenerating}
                      className="w-full sm:w-auto"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isGenerating ? 'Generating...' : 'Generate Custom Pattern'}
                    </Button>
                  </ActionSection>
                </>
              )}
            </FormSection>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <FormSection
              title="Calibration Process"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="space-y-3">
                {[
                  { num: 1, title: "Verify Settings", desc: "Set infill to 0° horizontal" },
                  { num: 2, title: "Start Print", desc: "Watch frame print first" },
                  { num: 3, title: "Baby Step", desc: "Adjust every 20-30mm" },
                  { num: 4, title: "Compare", desc: "Find best section" },
                  { num: 5, title: "Calculate", desc: "Use calculator for final offset" }
                ].map((step) => (
                  <div key={step.num} className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                      {step.num}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FormSection>

            <FormSection
              title="Printer Types"
              icon={<Info className="h-4 w-4" />}
            >
              <div className="grid gap-3">
                <InfoCard variant="success" title="Auto-Calibration Printers">
                  <p className="text-xs mb-1">Examples: Bambu Lab, Prusa MK4, FL-SUN S1 Pro</p>
                  <p className="text-xs">Baby stepping saves automatically - calculator may not be needed</p>
                </InfoCard>

                <InfoCard variant="info" title="Manual Printers">
                  <p className="text-xs mb-1">Examples: Ender 3, CR-10, Most DIY printers</p>
                  <p className="text-xs">Use calculator to determine permanent Z-offset value</p>
                </InfoCard>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default FirstLayerCalibrationV2;