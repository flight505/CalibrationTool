import { useState } from 'react';
import { Thermometer, Download, Settings, Package, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateTemperatureTower } from '@/utils/orcaTemperatureTower';
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
import { SliceSettingsInput } from './SliceSettingsInput';
import { SliceSettings } from '../utils/stlGeometryAnalyzer';

interface TemperatureTowerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

const TemperatureTower: React.FC<TemperatureTowerProps> = ({ onNavigate }) => {
  const [material, setMaterial] = useState('PLA');
  const [bestTemp, setBestTemp] = useState('');
  const [result, setResult] = useState<string | null>(null);

  // Tower generation states
  const [startTemp, setStartTemp] = useState('220');
  const [endTemp, setEndTemp] = useState('190');
  const [tempStep, setTempStep] = useState('5');
  const [includeBridge, setIncludeBridge] = useState(true);
  const [includeOverhang, setIncludeOverhang] = useState(true);
  const [includeLabels, setIncludeLabels] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [towerInstructions, setTowerInstructions] = useState<string | null>(null);

  // Slice settings state
  const [sliceSettings, setSliceSettings] = useState<SliceSettings>({
    layerHeight: 0.2,
    firstLayerHeight: 0.3,
    nozzleDiameter: 0.4
  });

  const materialOptions = [
    { value: 'PLA', label: 'PLA' },
    { value: 'PETG', label: 'PETG' },
    { value: 'ABS', label: 'ABS' },
    { value: 'TPU', label: 'TPU' },
    { value: 'PA-CF', label: 'PA-CF' },
  ];

  const materialRanges = {
    PLA: { min: 190, max: 230, typical: 210, start: 220, end: 190 },
    PETG: { min: 230, max: 250, typical: 240, start: 250, end: 220 },
    ABS: { min: 240, max: 270, typical: 255, start: 260, end: 230 },
    TPU: { min: 210, max: 240, typical: 225, start: 240, end: 210 },
    'PA-CF': { min: 280, max: 320, typical: 300, start: 310, end: 280 },
  };
  
  // Update tower settings when material changes
  const handleMaterialChange = (newMaterial: string) => {
    setMaterial(newMaterial);
    const range = materialRanges[newMaterial as keyof typeof materialRanges];
    setStartTemp(range.start.toString());
    setEndTemp(range.end.toString());
  };

  const generateTower = async (export3MF: boolean = false) => {
    try {
      setGenerating(true);
      
      const tower = await generateTemperatureTower({
        material: material as 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'PC' | 'PA',
        startValue: parseInt(startTemp),
        endValue: parseInt(endTemp),
        stepSize: parseInt(tempStep),
        includeLabels,
        includeModifierMesh: true,
        sliceSettings
      });
      
      if (export3MF) {
        // Export as 3MF with all settings embedded
        const project = await exportTowerAs3MF(
          tower,
          'temperature',
          `temperature_tower_${material.toLowerCase()}`
        );
        
        const url = URL.createObjectURL(project.file);
        const a = document.createElement('a');
        a.href = url;
        a.download = project.filename;
        a.click();
        URL.revokeObjectURL(url);
        
        setResult(`✅ 3MF project generated successfully!\n${tower.sections.length} temperature sections from ${startTemp}°C to ${endTemp}°C\nModifier meshes and settings are embedded in the file.`);
      } else {
        // Download individual STL files
        const url = URL.createObjectURL(tower.mainSTL);
        const a = document.createElement('a');
        a.href = url;
        a.download = `temperature_tower_${material.toLowerCase()}_${startTemp}-${endTemp}.stl`;
        a.click();
        URL.revokeObjectURL(url);
        
        // If modifier meshes are included, download them as well
        if (tower.modifierMeshes) {
          tower.modifierMeshes.forEach((mesh, index) => {
            const modUrl = URL.createObjectURL(mesh);
            const modA = document.createElement('a');
            modA.href = modUrl;
            modA.download = `modifier_section_${index}.stl`;
            setTimeout(() => {
              modA.click();
              URL.revokeObjectURL(modUrl);
            }, (index + 1) * 500); // Stagger downloads
          });
        }
        
        setResult(`✅ Temperature tower generated successfully!\n${tower.sections.length} temperature sections from ${startTemp}°C to ${endTemp}°C`);
      }
      
      setTowerInstructions(tower.instructions);
    } catch (error) {
      console.error('Error generating tower:', error);
      setResult('❌ Error generating tower. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  const analyze = () => {
    const temp = parseInt(bestTemp);
    if (isNaN(temp)) {
      setResult('Please enter a valid temperature');
      return;
    }

    const range = materialRanges[material as keyof typeof materialRanges];
    
    if (temp < range.min) {
      setResult(`⚠️ ${temp}°C is below the recommended range for ${material}. Consider retesting starting at ${range.min}°C.`);
    } else if (temp > range.max) {
      setResult(`⚠️ ${temp}°C is above the recommended range for ${material}. This may cause degradation. Consider ${range.max}°C or lower.`);
    } else {
      const firstLayerTemp = material === 'PETG' ? temp + 10 : temp + 5;
      setResult(`✅ Optimal temperature for ${material}: ${temp}°C\nFirst layer temperature: ${firstLayerTemp}°C`);
    }
  };

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="info" title="What to Look For">
        <ul className="space-y-1 text-xs">
          <li>• Best layer adhesion without stringing</li>
          <li>• Good overhang performance</li>
          <li>• Smooth surface finish</li>
          <li>• No drooping on bridges</li>
        </ul>
      </InfoCard>

      <InfoCard variant="warning" title="Common Issues">
        <ul className="space-y-1 text-xs">
          <li>• <strong>Too hot:</strong> Stringing, drooping, glossy</li>
          <li>• <strong>Too cold:</strong> Poor adhesion, rough surface</li>
          <li>• <strong>Just right:</strong> Matte finish, strong layers</li>
        </ul>
      </InfoCard>

      <InfoCard variant="tip" title="Material Ranges">
        <ul className="space-y-1 text-xs">
          <li>• <strong>PLA:</strong> 190-230°C (typical: 210°C)</li>
          <li>• <strong>PETG:</strong> 230-250°C (typical: 240°C)</li>
          <li>• <strong>ABS:</strong> 240-270°C (typical: 255°C)</li>
          <li>• <strong>TPU:</strong> 210-240°C (typical: 225°C)</li>
          <li>• <strong>PA-CF:</strong> 280-320°C (typical: 300°C)</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="First Layer Temperature">
        <p className="text-xs mb-1">For better bed adhesion, increase by:</p>
        <ul className="space-y-1 text-xs">
          <li>• <strong>PLA/ABS/TPU:</strong> +5°C</li>
          <li>• <strong>PETG:</strong> +5-10°C</li>
          <li>• <strong>PA-CF:</strong> +0-5°C</li>
        </ul>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Thermometer className="w-6 h-6" />}
      title="Temperature Tower"
      description="Find the optimal printing temperature for your filament"
      docPath="/docs/orca-slicer/calibration/calibration-guide.md"
      onNavigate={onNavigate}
      badge={{ text: 'Essential', variant: 'default' }}
    >

      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs defaultValue="analyze" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-lg">
            <TabsTrigger value="analyze">Analyze Results</TabsTrigger>
            <TabsTrigger value="generate">Generate Tower</TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4">
            <FormSection
              title="Temperature Analysis"
              description="Enter the best temperature from your tower test"
              icon={<Thermometer className="h-4 w-4" />}
            >
              <FieldGroup>
                <SelectField
                  label="Material Type"
                  id="material"
                  value={material}
                  onChange={handleMaterialChange}
                  options={materialOptions}
                />
                <TextField
                  label="Best Temperature"
                  id="best-temp"
                  type="number"
                  value={bestTemp}
                  onChange={setBestTemp}
                  unit="°C"
                  placeholder={materialRanges[material as keyof typeof materialRanges].typical.toString()}
                  helperText={`Typical range: ${materialRanges[material as keyof typeof materialRanges].min}°C - ${materialRanges[material as keyof typeof materialRanges].max}°C`}
                />
              </FieldGroup>

              <ActionSection>
                <Button onClick={analyze} className="w-full sm:w-auto">
                  Analyze Temperature
                </Button>
              </ActionSection>

              {result && result.includes('✅') && (
                <ResultCard
                  title="Optimal Temperature"
                  value={`${bestTemp}°C`}
                  description={result.replace('✅ ', '').replace(`Optimal temperature for ${material}: ${bestTemp}°C\n`, '')}
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" />}
                />
              )}
              {result && result.includes('⚠️') && (
                <InfoCard variant="warning">
                  {result.replace('⚠️ ', '')}
                </InfoCard>
              )}
              {result && !result.includes('✅') && !result.includes('⚠️') && (
                <InfoCard variant="warning">
                  {result}
                </InfoCard>
              )}
            </FormSection>
          </TabsContent>
        
          <TabsContent value="generate" className="space-y-4">
            <FormSection
              title="Generate Temperature Tower"
              description="Create a custom temperature calibration tower for your material"
              icon={<Settings className="h-4 w-4" />}
            >
              <FieldGroup>
                <SelectField
                  label="Material Type"
                  id="gen-material"
                  value={material}
                  onChange={handleMaterialChange}
                  options={materialOptions}
                />
                <TextField
                  label="Temperature Step"
                  id="temp-step"
                  type="number"
                  value={tempStep}
                  onChange={setTempStep}
                  unit="°C"
                  min={1}
                  max={10}
                  placeholder="5"
                />
              </FieldGroup>

              <SliceSettingsInput
                settings={sliceSettings}
                onChange={setSliceSettings}
              />

              <FieldGroup>
                <TextField
                  label="Start Temperature"
                  id="start-temp"
                  type="number"
                  value={startTemp}
                  onChange={setStartTemp}
                  unit="°C"
                  placeholder={materialRanges[material as keyof typeof materialRanges].start.toString()}
                />
                <TextField
                  label="End Temperature"
                  id="end-temp"
                  type="number"
                  value={endTemp}
                  onChange={setEndTemp}
                  unit="°C"
                  placeholder={materialRanges[material as keyof typeof materialRanges].end.toString()}
                />
              </FieldGroup>

              <div className="space-y-3">
                <SwitchField
                  label="Include Bridge Test"
                  id="include-bridge"
                  checked={includeBridge}
                  onCheckedChange={setIncludeBridge}
                />
                <SwitchField
                  label="Include Overhang Test"
                  id="include-overhang"
                  checked={includeOverhang}
                  onCheckedChange={setIncludeOverhang}
                  description="30°, 45°, 60°, 75° angles"
                />
                <SwitchField
                  label="Include Temperature Labels"
                  id="include-labels"
                  checked={includeLabels}
                  onCheckedChange={setIncludeLabels}
                />
              </div>

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

              {result && result.includes('tower generated') && (
                <InfoCard variant="success">
                  {result.replace('✅ ', '').replace('❌ ', '')}
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

export default TemperatureTower;