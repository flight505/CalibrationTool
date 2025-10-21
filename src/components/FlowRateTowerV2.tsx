import { useEffect, useRef, useState } from 'react';
import { Droplets, Package, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateFlowRateTower3MF } from '@/utils/orcaTower3MFExports';
import {
  CalibrationToolLayout,
  FormSection,
  InfoCard,
  ActionSection,
  TwoColumnLayout,
} from '@/components/calibration/CalibrationToolLayout';
import {
  TextField,
  SelectField,
  SwitchField,
  FieldGroup,
} from '@/components/calibration/FormFields';

interface FlowRateTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FlowRateTowerV2: React.FC<FlowRateTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [startFlow, setStartFlow] = useState('0.85');
  const [endFlow, setEndFlow] = useState('1.15');
  const [flowStep, setFlowStep] = useState('0.05');
  const [firmware, setFirmware] = useState<'marlin' | 'klipper' | 'rrf' | 'orcaslicer'>('marlin');
  const [useNativeModifiers, setUseNativeModifiers] = useState(firmware === 'orcaslicer');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

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

  const materialSettings = {
    PLA: { typical: '1.00', range: '0.90-1.10', description: 'PLA usually needs minimal adjustment' },
    PETG: { typical: '0.95', range: '0.85-1.05', description: 'PETG often needs slight reduction to prevent over-extrusion' },
    ABS: { typical: '1.00', range: '0.90-1.10', description: 'ABS similar to PLA' },
    TPU: { typical: '1.05', range: '0.95-1.15', description: 'TPU may need slight increase due to compression' },
    ASA: { typical: '1.00', range: '0.90-1.10', description: 'ASA similar to ABS' },
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    if (newMaterial === 'PETG') {
      setStartFlow('0.85');
      setEndFlow('1.05');
    } else if (newMaterial === 'TPU') {
      setStartFlow('0.95');
      setEndFlow('1.15');
    } else {
      setStartFlow('0.85');
      setEndFlow('1.15');
    }
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseFloat(startFlow),
        endValue: parseFloat(endFlow),
        stepSize: parseFloat(flowStep),
      };

      const project = await generateFlowRateTower3MF(
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
      setResult(`Flow Rate tower generated successfully!\n${numSections} flow ratio sections from ${startFlow} to ${endFlow}\n${modeMessage}`);
    } catch (error) {
      console.error('Error generating tower:', error);
      setResult('Error generating tower. Please try again.');
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
      <InfoCard variant="tip" title="Flow Format">
        <p className="text-xs">
          OrcaSlicer uses decimal format<br />
          1.00 = 100% flow<br />
          0.95 = 95% flow
        </p>
      </InfoCard>

      <InfoCard variant="info" title="Material Defaults">
        <ul className="space-y-1 text-xs">
          <li>• <strong>PLA:</strong> 1.00</li>
          <li>• <strong>PETG:</strong> 0.95</li>
          <li>• <strong>ABS:</strong> 1.00</li>
          <li>• <strong>TPU:</strong> 1.05</li>
          <li>• <strong>ASA:</strong> 1.00</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="What to Look For">
        <ul className="space-y-1 text-xs">
          <li>• No gaps between wall lines</li>
          <li>• No over-extrusion ridges</li>
          <li>• Smooth, consistent walls</li>
          <li>• Sharp corners</li>
          <li>• Good top surface quality</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Common Issues">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Too low:</strong> Gaps, weak walls</li>
          <li>• <strong>Too high:</strong> Rough surface</li>
          <li>• <strong>Just right:</strong> Smooth walls</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="Pro Tip">
        <p className="text-xs">
          Flow ratio affects dimensional accuracy.
          Lower values make parts smaller,
          higher values make them larger.
        </p>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Droplets className="w-6 h-6" />}
      title="Flow Rate Tower"
      description="Calibrate material flow ratio for perfect extrusion"
      docPath="/docs/orca-slicer/calibration/flow-rate-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Tower Generator', variant: 'secondary' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <FormSection
          title="Tower Configuration"
          description="Generate a tower to test different flow ratios"
          icon={<Settings className="h-4 w-4" />}
        >
          <InfoCard variant="info">
            The tower will test flow ratio variations to find your optimal value.
            Apply the result in: <strong>Material settings → Filament → Flow ratio</strong>
          </InfoCard>

          <FieldGroup>
            <SelectField
              label="Material Type"
              id="material"
              value={material}
              onChange={handleMaterialChange}
              options={materialOptions}
              helperText={`Typical: ${materialSettings[material as keyof typeof materialSettings].typical} | Range: ${materialSettings[material as keyof typeof materialSettings].range}`}
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
              label="Start Flow Ratio"
              id="start-flow"
              type="number"
              value={startFlow}
              onChange={setStartFlow}
              step={0.01}
              min={0.7}
              max={1.0}
              placeholder="0.85"
              helperText="Lower bound of test range"
            />
            <TextField
              label="End Flow Ratio"
              id="end-flow"
              type="number"
              value={endFlow}
              onChange={setEndFlow}
              step={0.01}
              min={1.0}
              max={1.3}
              placeholder="1.15"
              helperText="Upper bound of test range"
            />
          </FieldGroup>

          <TextField
            label="Step Size"
            id="flow-step"
            type="number"
            value={flowStep}
            onChange={setFlowStep}
            step={0.01}
            min={0.01}
            max={0.1}
            placeholder="0.05"
            helperText="Increment between test sections"
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

          {result && (
            <InfoCard variant={result.includes('Error') ? 'warning' : 'success'}>
              {result}
            </InfoCard>
          )}
        </FormSection>

        <FormSection
          title="Material Notes"
          icon={<Droplets className="h-4 w-4" />}
        >
          <InfoCard variant="info">
            <p className="text-sm font-medium mb-1">{material} Characteristics</p>
            <p className="text-xs">
              {materialSettings[material as keyof typeof materialSettings].description}
            </p>
          </InfoCard>
        </FormSection>

        <FormSection
          title="How to Use"
          icon={<CheckCircle2 className="h-4 w-4" />}
        >
          <div className="space-y-2 text-sm">
            <p>1. Import the 3MF file into OrcaSlicer</p>
            <p>2. Slice with your normal settings</p>
            <p>3. Print and examine each section</p>
            <p>4. Find the section with:</p>
            <ul className="ml-4 space-y-1 text-xs">
              <li>• No gaps between walls</li>
              <li>• No over-extrusion</li>
              <li>• Smooth surface</li>
            </ul>
            <p>5. Note that section's flow ratio</p>
            <p>6. Apply in Material settings → Flow ratio</p>
          </div>
        </FormSection>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default FlowRateTowerV2;
