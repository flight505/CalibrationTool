import { useEffect, useRef, useState } from 'react';
import { Gauge, Package, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMaxVolumetricTower3MF } from '@/utils/orcaTower3MFExports';
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

interface MaxVolumetricSpeedProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const MaxVolumetricSpeedV2: React.FC<MaxVolumetricSpeedProps> = ({ onNavigate }) => {
  // Calculator states
  const [start, setStart] = useState('15');
  const [measuredHeight, setMeasuredHeight] = useState('16');
  const [step, setStep] = useState('0.5');
  const [result, setResult] = useState<string | null>(null);

  // Tower generation states
  const [material, setMaterial] = useState('PLA');
  const [towerStart, setTowerStart] = useState('10');
  const [towerEnd, setTowerEnd] = useState('40');
  const [towerStep, setTowerStep] = useState('5');
  const [firmware, setFirmware] = useState<'marlin' | 'klipper' | 'rrf' | 'orcaslicer'>('marlin');
  const [useNativeModifiers, setUseNativeModifiers] = useState(firmware === 'orcaslicer');
  const [generating, setGenerating] = useState(false);
  const [towerResult, setTowerResult] = useState<string | null>(null);

  const materialOptions = [
    { value: 'PLA', label: 'PLA' },
    { value: 'PETG', label: 'PETG' },
    { value: 'ABS', label: 'ABS' },
    { value: 'TPU', label: 'TPU' },
    { value: 'ASA', label: 'ASA' },
  ];

  const firmwareOptions = [
    { value: 'marlin', label: 'Marlin' },
    { value: 'klipper', label: 'Klipper' },
    { value: 'rrf', label: 'RepRapFirmware' },
    { value: 'orcaslicer', label: 'OrcaSlicer Native' },
  ];

  const calculate = () => {
    const s = parseFloat(start) || 0;
    const h = parseFloat(measuredHeight) || 0;
    const st = parseFloat(step) || 0;
    const maxSpeed = s + (h * st);
    setResult(maxSpeed.toFixed(2));
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseInt(towerStart),
        endValue: parseInt(towerEnd),
        stepSize: parseInt(towerStep),
      };

      const project = await generateMaxVolumetricTower3MF(
        params,
        firmware,
        !useNativeModifiers
      );

      const url = URL.createObjectURL(project.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = project.filename;
      a.click();
      URL.revokeObjectURL(url);

      const numSections = Math.floor(Math.abs(params.endValue - params.startValue) / params.stepSize) + 1;
      const modeMessage = useNativeModifiers
        ? 'Orca native modifiers enabled'
        : 'Firmware post-processing G-code included';
      setTowerResult(`Max Volumetric Speed tower generated successfully!\n${numSections} speed sections from ${towerStart} to ${towerEnd} mm³/s\n${modeMessage}`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setTowerResult('Error generating tower. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

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
      <InfoCard variant="info" title="Typical Hotend Values">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Standard V6:</strong> 10-15 mm³/s</li>
          <li>• <strong>Volcano:</strong> 20-25 mm³/s</li>
          <li>• <strong>Dragon HF:</strong> 25-30 mm³/s</li>
          <li>• <strong>Rapido HF:</strong> 30-40 mm³/s</li>
          <li>• <strong>CHT Nozzle:</strong> +20-30% boost</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Signs of Limit">
        <ul className="space-y-1 text-xs">
          <li>• Rough surface texture</li>
          <li>• Thin/missing layers</li>
          <li>• Clicking/skipping extruder</li>
          <li>• Inconsistent extrusion</li>
          <li>• Under-extrusion patterns</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="Material Dependencies">
        <ul className="space-y-1 text-xs">
          <li>• <strong>PLA:</strong> Baseline reference</li>
          <li>• <strong>PETG:</strong> ~80% of PLA</li>
          <li>• <strong>ABS:</strong> ~90% of PLA</li>
          <li>• <strong>TPU:</strong> ~50% of PLA</li>
          <li>• <strong>PA-CF:</strong> ~70% of PLA</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Temperature Effect">
        <p className="text-xs">
          Higher temps = higher flow capacity.
          +10°C can increase max flow by 10-15%.
        </p>
      </InfoCard>

      <InfoCard variant="info" title="Formula">
        <p className="text-xs font-mono">
          Volume = Layer × Width × Speed
        </p>
        <p className="text-xs mt-1">
          Example: 0.2 × 0.4 × 300 = 24 mm³/s
        </p>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Gauge className="w-6 h-6" />}
      title="Maximum Volumetric Speed"
      description="Find your hotend's maximum melting capacity"
      docPath="/docs/orca-slicer/calibration/calibration-guide.md"
      onNavigate={onNavigate}
      badge={{ text: 'Performance', variant: 'secondary' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="calculate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-lg">
            <TabsTrigger value="calculate">Calculate from Test</TabsTrigger>
            <TabsTrigger value="generate">Generate Tower</TabsTrigger>
          </TabsList>

          <TabsContent value="calculate" className="space-y-4">
            <FormSection
              title="Speed Calculator"
              description="Calculate max volumetric speed from test results"
              icon={<Gauge className="h-4 w-4" />}
            >
              <FieldGroup>
                <TextField
                  label="Start Value"
                  id="start"
                  type="number"
                  value={start}
                  onChange={setStart}
                  step={1}
                  unit="mm³/s"
                  placeholder="15"
                  helperText="Typical starting point for most hotends"
                />
                <TextField
                  label="Measured Height"
                  id="measured-height"
                  type="number"
                  value={measuredHeight}
                  onChange={setMeasuredHeight}
                  unit="mm"
                  placeholder="16"
                  helperText="Height before under-extrusion starts"
                />
              </FieldGroup>

              <TextField
                label="Step Size"
                id="step"
                type="number"
                value={step}
                onChange={setStep}
                step={0.1}
                unit="mm³/s per mm"
                placeholder="0.5"
              />

              <ActionSection>
                <Button onClick={calculate} className="w-full sm:w-auto">
                  Calculate Max Volumetric Speed
                </Button>
              </ActionSection>

              {result && (
                <ResultCard
                  title="Maximum Volumetric Speed"
                  value={`${result} mm³/s`}
                  description="Enter in: Filament Settings → Advanced → Max Volumetric Speed"
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>

            <FormSection
              title="Safety Margin"
              icon={<Gauge className="h-4 w-4" />}
            >
              <InfoCard variant="tip">
                Use 80-90% of your tested maximum for reliable printing.
                This accounts for temperature variations and ensures consistent quality across the entire print.
              </InfoCard>
            </FormSection>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <FormSection
              title="Generate Test Tower"
              description="Create a tower to find your hotend's maximum flow capacity"
              icon={<Settings className="h-4 w-4" />}
            >
              <FieldGroup>
                <SelectField
                  label="Material Type"
                  id="gen-material"
                  value={material}
                  onChange={setMaterial}
                  options={materialOptions}
                />
                <SelectField
                  label="Firmware Type"
                  id="firmware"
                  value={firmware}
                  onChange={(v) => setFirmware(v as any)}
                  options={firmwareOptions}
                />
              </FieldGroup>

              <FieldGroup>
                <TextField
                  label="Start Speed"
                  id="tower-start"
                  type="number"
                  value={towerStart}
                  onChange={setTowerStart}
                  unit="mm³/s"
                  min={5}
                  max={100}
                  placeholder="10"
                />
                <TextField
                  label="End Speed"
                  id="tower-end"
                  type="number"
                  value={towerEnd}
                  onChange={setTowerEnd}
                  unit="mm³/s"
                  min={10}
                  max={100}
                  placeholder="40"
                />
              </FieldGroup>

              <TextField
                label="Step Size"
                id="tower-step"
                type="number"
                value={towerStep}
                onChange={setTowerStep}
                unit="mm³/s"
                min={1}
                max={10}
                placeholder="5"
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
                  onClick={generateTower}
                  disabled={generating}
                  className="w-full sm:w-auto"
                >
                  {generating ? 'Generating...' : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Generate 3MF Project
                    </>
                  )}
                </Button>
              </ActionSection>

              {towerResult && (
                <InfoCard variant={towerResult.includes('Error') ? 'warning' : 'success'}>
                  {towerResult}
                </InfoCard>
              )}
            </FormSection>

            <FormSection
              title="Test Procedure"
              icon={<Settings className="h-4 w-4" />}
            >
              <div className="space-y-2 text-sm">
                <p>1. Import the 3MF file into OrcaSlicer</p>
                <p>2. Slice with these settings:</p>
                <ul className="ml-4 space-y-1 text-xs">
                  <li>• Layer height: 0.2mm (or your preference)</li>
                  <li>• Line width: 0.4mm (or your nozzle size)</li>
                  <li>• Infill: 20-30%</li>
                </ul>
                <p>3. Print and observe where under-extrusion starts</p>
                <p>4. Measure the height where quality degrades</p>
                <p>5. Calculate: Max Speed = Start + (Height × Step)</p>
              </div>
            </FormSection>
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default MaxVolumetricSpeedV2;
