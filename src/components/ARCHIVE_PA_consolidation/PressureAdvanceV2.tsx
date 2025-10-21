import { useState } from 'react';
import { Move3D, Download, Settings, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generatePressureAdvanceTower } from '@/utils/orcaPressureAdvanceTower';
import { exportTowerAs3MF } from '@/utils/orca3mfExporter';
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

interface PressureAdvanceProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const PressureAdvanceV2: React.FC<PressureAdvanceProps> = ({ onNavigate }) => {
  // Calculator states
  const [extruderType, setExtruderType] = useState('DDE');
  const [paStep, setPaStep] = useState('0.002');
  const [measuredHeight, setMeasuredHeight] = useState('8');
  const [result, setResult] = useState<string | null>(null);

  // Tower generation states
  const [towerExtruderType, setTowerExtruderType] = useState<'direct_drive' | 'bowden' | 'high_speed'>('direct_drive');
  const [startPA, setStartPA] = useState('0.00');
  const [endPA, setEndPA] = useState('0.10');
  const [paStepGen, setPAStepGen] = useState('0.01');
  const [printSpeed, setPrintSpeed] = useState('100');
  const [includeLabels, setIncludeLabels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null);

  const extruderOptions = [
    { value: 'DDE', label: 'Direct Drive (DDE)' },
    { value: 'Bowden', label: 'Bowden' },
  ];

  const towerExtruderOptions = [
    { value: 'direct_drive', label: 'Direct Drive' },
    { value: 'bowden', label: 'Bowden' },
    { value: 'high_speed', label: 'High-Speed Direct' },
  ];

  const calculate = () => {
    const step = parseFloat(paStep) || 0;
    const height = parseFloat(measuredHeight) || 0;
    const calculatedPA = step * height;
    setResult(calculatedPA.toFixed(4));
  };

  const handleExtruderTypeChange = (type: string) => {
    setTowerExtruderType(type as 'direct_drive' | 'bowden' | 'high_speed');
    // Set appropriate defaults based on extruder type
    if (type === 'direct_drive') {
      setStartPA('0.00');
      setEndPA('0.10');
      setPAStepGen('0.01');
    } else if (type === 'bowden') {
      setStartPA('0.00');
      setEndPA('0.50');
      setPAStepGen('0.05');
    } else {
      setStartPA('0.00');
      setEndPA('0.05');
      setPAStepGen('0.005');
    }
  };

  const generateTower = async (export3MF: boolean = false) => {
    try {
      setGenerating(true);

      const tower = await generatePressureAdvanceTower({
        extruderType: towerExtruderType,
        startValue: parseFloat(startPA),
        endValue: parseFloat(endPA),
        stepSize: parseFloat(paStepGen),
        printSpeed: parseInt(printSpeed),
        includeLabels,
        includeModifierMesh: true
      });

      if (export3MF) {
        const project = await exportTowerAs3MF(
          tower,
          'pressure_advance',
          `pa_tower_${towerExtruderType}`
        );

        const url = URL.createObjectURL(project.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = project.filename;
        a.click();
        URL.revokeObjectURL(url);

        setGenResult(`3MF project generated successfully!\n${tower.sections.length} PA sections from ${startPA} to ${endPA}\nModifier meshes and settings are embedded in the file.`);
      } else {
        const url = URL.createObjectURL(tower.mainSTL);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pa_tower_${towerExtruderType}_${startPA}-${endPA}.stl`;
        a.click();
        URL.revokeObjectURL(url);

        if (tower.modifierMeshes) {
          tower.modifierMeshes.forEach((mesh, index) => {
            const modUrl = URL.createObjectURL(mesh);
            const modA = document.createElement('a');
            modA.href = modUrl;
            modA.download = `pa_modifier_section_${index}.stl`;
            setTimeout(() => {
              modA.click();
              URL.revokeObjectURL(modUrl);
            }, (index + 1) * 500);
          });
        }

        setGenResult(`Pressure Advance tower generated successfully!\n${tower.sections.length} PA sections from ${startPA} to ${endPA}`);
      }

      setTowerInstructions(tower.instructions);
    } catch (error) {
      console.error('Error generating tower:', error);
      setGenResult('Error generating tower. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="info" title="Quick Reference">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Direct Drive:</strong> 0.002-0.050</li>
          <li>• <strong>Bowden:</strong> 0.020-0.200</li>
          <li>• <strong>High Speed:</strong> 0.001-0.030</li>
          <li>• <strong>Formula:</strong> PA = Step × Height</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="What to Look For">
        <ul className="space-y-1 text-xs">
          <li>• Sharp 90° corners without bulging</li>
          <li>• No gaps at corner starts</li>
          <li>• Consistent line width</li>
          <li>• Clean direction changes</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Common Issues">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Too low:</strong> Bulging corners</li>
          <li>• <strong>Too high:</strong> Gaps at corners</li>
          <li>• <strong>Way off:</strong> Inconsistent extrusion</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Firmware Support">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Marlin:</strong> M900 K</li>
          <li>• <strong>Klipper:</strong> SET_PRESSURE_ADVANCE</li>
          <li>• <strong>RepRap:</strong> M572</li>
        </ul>
      </InfoCard>

      <InfoCard variant="info" title="Material Notes">
        <p className="text-xs">
          Different materials need different PA values.
          Flexible materials typically need lower values,
          while stiff materials need higher values.
        </p>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Move3D className="w-6 h-6" />}
      title="Pressure Advance Calibration"
      description="Tune pressure advance for sharper corners and better print quality"
      docPath="/docs/orca-slicer/calibration/adaptive-pressure-advance-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Advanced', variant: 'secondary' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="calculate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-lg">
            <TabsTrigger value="calculate">Calculate PA</TabsTrigger>
            <TabsTrigger value="generate">Generate Tower</TabsTrigger>
          </TabsList>

          <TabsContent value="calculate" className="space-y-4">
            <FormSection
              title="PA Calculator"
              description="Calculate PA value from tower test results"
              icon={<Move3D className="h-4 w-4" />}
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
                  label="PA Step (A)"
                  id="pa-step"
                  type="number"
                  value={paStep}
                  onChange={setPaStep}
                  step={0.001}
                  placeholder="0.002"
                  helperText={`Typical: ${extruderType === 'DDE' ? '0.002' : '0.02'} for ${extruderType}`}
                />
                <TextField
                  label="Measured Height (B)"
                  id="measured-height"
                  type="number"
                  value={measuredHeight}
                  onChange={setMeasuredHeight}
                  unit="mm"
                  placeholder="8"
                  helperText="Height where corners look best"
                />
              </FieldGroup>

              <ActionSection>
                <Button onClick={calculate} className="w-full sm:w-auto">
                  Calculate PA Value
                </Button>
              </ActionSection>

              {result && (
                <ResultCard
                  title="Pressure Advance Value"
                  value={result}
                  description="Enter in Filament Settings → Advanced → Pressure Advance"
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
            </FormSection>

            <FormSection
              title="Understanding PA"
              icon={<Move3D className="h-4 w-4" />}
            >
              <InfoCard variant="info">
                PA compensates for the elastic properties of molten filament. During acceleration,
                pressure builds up in the nozzle. During deceleration, this pressure needs to be
                relieved. PA adjusts extrusion in advance to maintain consistent flow.
              </InfoCard>
            </FormSection>
          </TabsContent>

          <TabsContent value="generate" className="space-y-4">
            <FormSection
              title="Generate PA Tower"
              description="Create a custom PA calibration tower for your printer"
              icon={<Settings className="h-4 w-4" />}
            >
              <SelectField
                label="Extruder Type"
                id="gen-extruder"
                value={towerExtruderType}
                onChange={handleExtruderTypeChange}
                options={towerExtruderOptions}
              />

              <FieldGroup>
                <TextField
                  label="Start PA Value"
                  id="start-pa"
                  type="number"
                  value={startPA}
                  onChange={setStartPA}
                  step={0.01}
                  placeholder="0.00"
                />
                <TextField
                  label="End PA Value"
                  id="end-pa"
                  type="number"
                  value={endPA}
                  onChange={setEndPA}
                  step={0.01}
                  placeholder="0.10"
                />
              </FieldGroup>

              <FieldGroup>
                <TextField
                  label="PA Step"
                  id="pa-step-gen"
                  type="number"
                  value={paStepGen}
                  onChange={setPAStepGen}
                  step={0.001}
                  placeholder="0.01"
                />
                <TextField
                  label="Print Speed"
                  id="print-speed"
                  type="number"
                  value={printSpeed}
                  onChange={setPrintSpeed}
                  unit="mm/s"
                  placeholder="100"
                  helperText="Higher speeds make PA effects more visible"
                />
              </FieldGroup>

              <SwitchField
                label="Include PA Value Labels"
                id="include-labels"
                checked={includeLabels}
                onCheckedChange={setIncludeLabels}
              />

              <ActionSection>
                <Button
                  onClick={() => generateTower(false)}
                  variant="outline"
                  disabled={generating}
                  className="w-full sm:w-auto"
                >
                  {generating ? 'Generating...' : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download STL Files
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => generateTower(true)}
                  disabled={generating}
                  className="w-full sm:w-auto"
                >
                  {generating ? 'Generating...' : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Download 3MF Project
                    </>
                  )}
                </Button>
              </ActionSection>

              {genResult && (
                <InfoCard variant={genResult.includes('Error') ? 'warning' : 'success'}>
                  {genResult}
                </InfoCard>
              )}
            </FormSection>

            {towerInstructions && (
              <FormSection
                title="Tower Setup Instructions"
                icon={<Settings className="h-4 w-4" />}
              >
                <pre className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {towerInstructions}
                </pre>
              </FormSection>
            )}
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default PressureAdvanceV2;