import { useState } from 'react';
import { Grid3x3, Table2, Download, Trash2, ExternalLink } from 'lucide-react';
import { FormSection, InfoCard } from '@/components/calibration/CalibrationToolLayout';
import { TextField, FieldGroup } from '@/components/calibration/FormFields';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PATestConfig, PATestResult } from '@/lib/pa-optimizer';

interface PAInputPanelProps {
  config: PATestConfig;
  testData: PATestResult[];
  onConfigChange: (config: PATestConfig) => void;
  onTestDataChange: (data: PATestResult[]) => void;
  onLoadExample: () => void;
  onClearData: () => void;
}

export const PAInputPanel: React.FC<PAInputPanelProps> = ({
  config,
  testData,
  onConfigChange,
  onTestDataChange,
  onLoadExample,
  onClearData,
}) => {
  const [inputMode, setInputMode] = useState<'grid' | 'table'>('grid');

  const speeds = config.speeds;
  const accelerations = config.accelerations;

  const estimateFlow = (speed: number): number => {
    return (speed * config.layerHeight * config.lineWidth) / 60;
  };

  const handleTileChange = (tileId: number, field: 'paValue' | 'flow', value: string) => {
    const numValue = parseFloat(value);
    if (!isFinite(numValue)) return;

    const existing = testData.find(d => d.tileId === tileId);
    if (existing) {
      onTestDataChange(
        testData.map(d => d.tileId === tileId ? { ...d, [field]: numValue } : d)
      );
    } else {
      // Create new entry
      const col = (tileId - 1) % speeds.length;
      const row = Math.floor((tileId - 1) / speeds.length);
      const speed = speeds[col];
      const accel = accelerations[row];
      const flow = field === 'flow' ? numValue : estimateFlow(speed);
      const paValue = field === 'paValue' ? numValue : 0;

      onTestDataChange([
        ...testData,
        { tileId, speed, accel, flow, paValue }
      ]);
    }
  };

  const getTileData = (tileId: number): PATestResult | null => {
    return testData.find(d => d.tileId === tileId) || null;
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Generate PA Pattern in OrcaSlicer"
        description="Use OrcaSlicer's built-in calibration tool to generate your PA test pattern"
      >
        <InfoCard variant="info" title="How to Generate PA Pattern">
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Open <strong>OrcaSlicer</strong></li>
            <li>Go to <strong>Calibration → Pressure Advance</strong></li>
            <li>Enter the configuration values below (Start PA, End PA, Step, Speeds, Accelerations)</li>
            <li>Click <strong>Generate</strong> to create the 3MF project file</li>
            <li>Slice and <strong>print</strong> the pattern</li>
            <li>Identify which tiles produced the <strong>best corner quality</strong></li>
            <li>Return here to input your results for advanced analysis</li>
          </ol>
        </InfoCard>

        <InfoCard variant="tip" title="Important: Match Your Configuration">
          <p className="text-sm">
            Use the <strong>exact same values</strong> in OrcaSlicer&apos;s PA calibration dialog
            and in the configuration section below. This ensures accurate analysis and adaptive PA table generation.
          </p>
        </InfoCard>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <a href="/docs/calibration/using-pa-optimizer-with-orcaslicer" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              View Detailed Guide
            </a>
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="PA Test Parameters"
        description="Enter your PA test configuration (use same values in OrcaSlicer)"
      >
        <FieldGroup>
          <TextField
            id="start-pa"
            label="Start PA"
            type="number"
            value={config.startPA.toString()}
            onChange={(value) => onConfigChange({ ...config, startPA: parseFloat(value) || 0 })}
            step={0.001}
          />
          <TextField
            id="end-pa"
            label="End PA"
            type="number"
            value={config.endPA.toString()}
            onChange={(value) => onConfigChange({ ...config, endPA: parseFloat(value) || 0 })}
            step={0.001}
          />
          <TextField
            id="pa-step"
            label="PA Step"
            type="number"
            value={config.paStep.toString()}
            onChange={(value) => onConfigChange({ ...config, paStep: parseFloat(value) || 0 })}
            step={0.001}
          />
        </FieldGroup>

        <FieldGroup>
          <TextField
            id="layer-height"
            label="Layer Height"
            type="number"
            value={config.layerHeight.toString()}
            onChange={(value) => onConfigChange({ ...config, layerHeight: parseFloat(value) || 0 })}
            step={0.01}
            unit="mm"
          />
          <TextField
            id="line-width"
            label="Line Width"
            type="number"
            value={config.lineWidth.toString()}
            onChange={(value) => onConfigChange({ ...config, lineWidth: parseFloat(value) || 0 })}
            step={0.01}
            unit="mm"
          />
        </FieldGroup>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Speeds (mm/s)</label>
            <p className="text-xs text-muted-foreground mb-2">Enter 3 speeds for the 3×3 grid columns</p>
            <div className="grid grid-cols-3 gap-3">
              <TextField
                id="speed-1"
                label="Speed 1"
                type="number"
                value={config.speeds[0]?.toString() || '120'}
                onChange={(value) => {
                  const newSpeeds = [...config.speeds];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newSpeeds[0] = isNaN(numValue) ? config.speeds[0] : numValue;
                  onConfigChange({ ...config, speeds: newSpeeds });
                }}
                step={1}
                unit="mm/s"
                min={0}
              />
              <TextField
                id="speed-2"
                label="Speed 2"
                type="number"
                value={config.speeds[1]?.toString() || '150'}
                onChange={(value) => {
                  const newSpeeds = [...config.speeds];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newSpeeds[1] = isNaN(numValue) ? config.speeds[1] : numValue;
                  onConfigChange({ ...config, speeds: newSpeeds });
                }}
                step={1}
                unit="mm/s"
                min={0}
              />
              <TextField
                id="speed-3"
                label="Speed 3"
                type="number"
                value={config.speeds[2]?.toString() || '200'}
                onChange={(value) => {
                  const newSpeeds = [...config.speeds];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newSpeeds[2] = isNaN(numValue) ? config.speeds[2] : numValue;
                  onConfigChange({ ...config, speeds: newSpeeds });
                }}
                step={1}
                unit="mm/s"
                min={0}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Accelerations (mm/s²)</label>
            <p className="text-xs text-muted-foreground mb-2">Enter 3 accelerations for the 3×3 grid rows</p>
            <div className="grid grid-cols-3 gap-3">
              <TextField
                id="accel-1"
                label="Accel 1"
                type="number"
                value={config.accelerations[0]?.toString() || '4000'}
                onChange={(value) => {
                  const newAccels = [...config.accelerations];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newAccels[0] = isNaN(numValue) ? config.accelerations[0] : numValue;
                  onConfigChange({ ...config, accelerations: newAccels });
                }}
                step={100}
                unit="mm/s²"
                min={0}
              />
              <TextField
                id="accel-2"
                label="Accel 2"
                type="number"
                value={config.accelerations[1]?.toString() || '6000'}
                onChange={(value) => {
                  const newAccels = [...config.accelerations];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newAccels[1] = isNaN(numValue) ? config.accelerations[1] : numValue;
                  onConfigChange({ ...config, accelerations: newAccels });
                }}
                step={100}
                unit="mm/s²"
                min={0}
              />
              <TextField
                id="accel-3"
                label="Accel 3"
                type="number"
                value={config.accelerations[2]?.toString() || '10000'}
                onChange={(value) => {
                  const newAccels = [...config.accelerations];
                  const numValue = value === '' ? 0 : parseFloat(value);
                  newAccels[2] = isNaN(numValue) ? config.accelerations[2] : numValue;
                  onConfigChange({ ...config, accelerations: newAccels });
                }}
                step={100}
                unit="mm/s²"
                min={0}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onLoadExample} className="gap-2">
            <Download className="h-4 w-4" />
            Load Example Data
          </Button>
          <Button variant="outline" size="sm" onClick={onClearData} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="Test Results"
        description="Enter PA values from your printed calibration tiles"
      >
        <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'grid' | 'table')}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="grid" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="table" className="gap-2">
              <Table2 className="h-4 w-4" />
              Table View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 9 }, (_, i) => {
                const tileId = i + 1;
                const col = i % 3;
                const row = Math.floor(i / 3);
                const speed = speeds[col];
                const accel = accelerations[row];
                const tileData = getTileData(tileId);
                const estimatedFlow = estimateFlow(speed);

                return (
                  <Card key={tileId} className="border-muted">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">
                        Tile {tileId}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {speed} mm/s · {accel} mm/s²
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextField
                        id={`pa-${tileId}`}
                        label="PA Value"
                        type="number"
                        value={tileData?.paValue.toString() || ''}
                        onChange={(value) => handleTileChange(tileId, 'paValue', value)}
                        step={0.001}
                        placeholder="0.020"
                      />
                      <TextField
                        id={`flow-${tileId}`}
                        label="Flow (mm³/s)"
                        type="number"
                        value={tileData?.flow.toString() || estimatedFlow.toFixed(2)}
                        onChange={(value) => handleTileChange(tileId, 'flow', value)}
                        step={0.01}
                        helperText={`Est: ${estimatedFlow.toFixed(2)}`}
                      />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-4 mt-4">
            <div className="overflow-x-auto rounded-lg border border-muted">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="text-left">
                    <th className="px-4 py-2 font-medium">Tile</th>
                    <th className="px-4 py-2 font-medium">Speed (mm/s)</th>
                    <th className="px-4 py-2 font-medium">Accel (mm/s²)</th>
                    <th className="px-4 py-2 font-medium">Flow (mm³/s)</th>
                    <th className="px-4 py-2 font-medium">PA Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 9 }, (_, i) => {
                    const tileId = i + 1;
                    const col = i % 3;
                    const row = Math.floor(i / 3);
                    const speed = speeds[col];
                    const accel = accelerations[row];
                    const tileData = getTileData(tileId);

                    return (
                      <tr key={tileId} className="border-t border-muted/60">
                        <td className="px-4 py-2">{tileId}</td>
                        <td className="px-4 py-2">{speed}</td>
                        <td className="px-4 py-2">{accel}</td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={tileData?.flow.toFixed(2) || ''}
                            onChange={(e) => handleTileChange(tileId, 'flow', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border rounded bg-background"
                            placeholder={estimateFlow(speed).toFixed(2)}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            step="0.001"
                            value={tileData?.paValue.toFixed(3) || ''}
                            onChange={(e) => handleTileChange(tileId, 'paValue', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border rounded bg-background"
                            placeholder="0.020"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {testData.length > 0 && (
          <InfoCard variant="success">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                <strong>{testData.length} of 9</strong> tiles entered
              </span>
              {testData.length >= 3 && (
                <span className="text-xs text-muted-foreground">
                  ✓ Ready for analysis
                </span>
              )}
            </div>
          </InfoCard>
        )}
      </FormSection>
    </div>
  );
};
