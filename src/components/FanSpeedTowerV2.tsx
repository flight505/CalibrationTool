import { useEffect, useRef, useState } from 'react';
import { Wind, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateFanSpeedTower3MF } from '@/utils/orcaTower3MFExports';
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

interface FanSpeedTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const FanSpeedTowerV2: React.FC<FanSpeedTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [startFan, setStartFan] = useState('0');
  const [endFan, setEndFan] = useState('100');
  const [fanStep, setFanStep] = useState('20');
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
    PLA: { recommended: '100', min: '60', description: 'PLA typically needs good cooling' },
    PETG: { recommended: '50', min: '30', description: 'PETG needs moderate cooling to prevent stringing' },
    ABS: { recommended: '0-30', min: '0', description: 'ABS needs minimal cooling to prevent warping' },
    TPU: { recommended: '0-50', min: '0', description: 'TPU flexible materials need light cooling' },
    ASA: { recommended: '0-30', min: '0', description: 'ASA similar to ABS, minimal cooling' },
  };

  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    if (newMaterial === 'ABS' || newMaterial === 'ASA') {
      setStartFan('0');
      setEndFan('50');
      setFanStep('10');
    } else if (newMaterial === 'PETG' || newMaterial === 'TPU') {
      setStartFan('0');
      setEndFan('80');
      setFanStep('20');
    } else {
      setStartFan('0');
      setEndFan('100');
      setFanStep('20');
    }
  };

  const generateTower = async () => {
    try {
      setGenerating(true);

      const params = {
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA',
        startValue: parseInt(startFan),
        endValue: parseInt(endFan),
        stepSize: parseInt(fanStep),
      };

      const project = await generateFanSpeedTower3MF(
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
      setResult(`Fan Speed tower generated successfully!\n${numSections} fan speed sections from ${startFan}% to ${endFan}%\n${modeMessage}`);
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
      <InfoCard variant="info" title="Material Cooling">
        <ul className="space-y-1 text-xs">
          <li>• <strong>PLA:</strong> 100% typical</li>
          <li>• <strong>PETG:</strong> 50% typical</li>
          <li>• <strong>ABS:</strong> 0-30% max</li>
          <li>• <strong>TPU:</strong> 0-50% max</li>
          <li>• <strong>ASA:</strong> 0-30% max</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="What to Test">
        <ul className="space-y-1 text-xs">
          <li>• Bridging quality</li>
          <li>• Overhang performance</li>
          <li>• Layer adhesion</li>
          <li>• Stringing between towers</li>
          <li>• Surface finish</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Balance Points">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Too much:</strong> Poor adhesion</li>
          <li>• <strong>Too little:</strong> Drooping, stringing</li>
          <li>• <strong>First layer:</strong> Usually 0%</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="Pro Tips">
        <ul className="space-y-1 text-xs">
          <li>• Disable fan for first 2-3 layers</li>
          <li>• Bridge fan speed can differ</li>
          <li>• Small features need more cooling</li>
          <li>• Enclosures affect cooling needs</li>
        </ul>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Wind className="w-6 h-6" />}
      title="Fan Speed Tower"
      description="Optimize cooling fan speed for best print quality"
      docPath="/docs/orca-slicer/calibration/fan-speed-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Cooling', variant: 'secondary' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <FormSection
          title="Tower Configuration"
          description="Generate a tower to test different fan speeds"
          icon={<Settings className="h-4 w-4" />}
        >
          <FieldGroup>
            <SelectField
              label="Material Type"
              id="material"
              value={material}
              onChange={handleMaterialChange}
              options={materialOptions}
              helperText={materialSettings[material as keyof typeof materialSettings].description}
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
              label="Start Fan Speed"
              id="start-fan"
              type="number"
              value={startFan}
              onChange={setStartFan}
              unit="%"
              min={0}
              max={100}
              step={5}
              placeholder="0"
              helperText="Lower bound of test range"
            />
            <TextField
              label="End Fan Speed"
              id="end-fan"
              type="number"
              value={endFan}
              onChange={setEndFan}
              unit="%"
              min={0}
              max={100}
              step={5}
              placeholder="100"
              helperText="Upper bound of test range"
            />
          </FieldGroup>

          <TextField
            label="Step Size"
            id="fan-step"
            type="number"
            value={fanStep}
            onChange={setFanStep}
            unit="%"
            min={5}
            max={25}
            step={5}
            placeholder="20"
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
          title="Material Recommendations"
          icon={<Wind className="h-4 w-4" />}
        >
          <InfoCard variant="info">
            <p className="text-sm font-medium mb-1">{material} Cooling</p>
            <p className="text-xs">
              Recommended: {materialSettings[material as keyof typeof materialSettings].recommended}%<br />
              Minimum: {materialSettings[material as keyof typeof materialSettings].min}%
            </p>
          </InfoCard>
        </FormSection>

        <FormSection
          title="Test Procedure"
          icon={<Settings className="h-4 w-4" />}
        >
          <div className="space-y-2 text-sm">
            <p>1. Import the 3MF file into OrcaSlicer</p>
            <p>2. Slice with your normal settings</p>
            <p>3. Print and observe each section for:</p>
            <ul className="ml-4 space-y-1 text-xs">
              <li>• Bridge quality</li>
              <li>• Overhang angles</li>
              <li>• Surface finish</li>
              <li>• Layer adhesion</li>
            </ul>
            <p>4. Select optimal fan speed</p>
            <p>5. Apply in cooling settings</p>
          </div>
        </FormSection>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default FanSpeedTowerV2;
