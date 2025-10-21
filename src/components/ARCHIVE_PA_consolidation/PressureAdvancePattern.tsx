import { useEffect, useMemo, useState } from 'react';
import { Move3D, Download, ClipboardCheck, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CalibrationToolLayout,
  FormSection,
  InfoCard,
  TwoColumnLayout,
} from '@/components/calibration/CalibrationToolLayout';
import { FieldGroup, TextField } from '@/components/calibration/FormFields';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface PressureAdvancePatternProps {
  onNavigate?: (tool: string, path?: string) => void;
}

interface TileInput {
  chevron: string;
  flow: string;
}

interface APAResult {
  tile: number;
  speed: number;
  accel: number;
  flow: number;
  chevron: number;
  pa: number;
}

const speeds = [120, 150, 200];
const accelerations = [4000, 6000, 10000];

const defaultConfig = {
  startPA: '0.000',
  endPA: '0.028',
  paStep: '0.002',
  layerHeight: '0.16',
  lineWidth: '0.48',
};

const patternAssets = {
  stl: '/templates/pa_pattern_ascii.stl',
  tower: '/templates/pa_tower_with_seam_ascii.stl',
  project: '/templates/pa_pattern.3mf',
};

const estimateFlow = (speed: number, layerHeight: number, lineWidth: number) => {
  if (!layerHeight || !lineWidth) return 0;
  return (speed * layerHeight * lineWidth) / 60;
};

const buildInitialTiles = () => {
  const layerHeight = parseFloat(defaultConfig.layerHeight);
  const lineWidth = parseFloat(defaultConfig.lineWidth);

  return Array.from({ length: speeds.length * accelerations.length }, (_, index) => {
    const speed = speeds[index % speeds.length];
    const estimated = estimateFlow(speed, layerHeight, lineWidth);

    return {
      chevron: '',
      flow: estimated ? estimated.toFixed(2) : '',
    } satisfies TileInput;
  });
};

const PressureAdvancePattern: React.FC<PressureAdvancePatternProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState(defaultConfig);
  const [tiles, setTiles] = useState<TileInput[]>(buildInitialTiles);
  const [results, setResults] = useState<APAResult[]>([]);
  const [copied, setCopied] = useState(false);

  const numericConfig = useMemo(() => ({
    startPA: parseFloat(config.startPA) || 0,
    endPA: parseFloat(config.endPA) || 0,
    paStep: parseFloat(config.paStep) || 0,
    layerHeight: parseFloat(config.layerHeight) || 0,
    lineWidth: parseFloat(config.lineWidth) || 0,
  }), [config]);

  useEffect(() => {
    setCopied(false);
  }, [results]);

  const handleConfigChange = (key: keyof typeof config, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleTileChange = (index: number, field: keyof TileInput, value: string) => {
    setTiles((prev) => prev.map((tile, idx) => idx === index ? { ...tile, [field]: value } : tile));
  };

  const getTilePA = (chevronValue: string) => {
    const chevron = parseInt(chevronValue, 10);
    if (!Number.isFinite(chevron) || chevron <= 0) return null;
    if (numericConfig.paStep <= 0) return null;
    const pa = numericConfig.startPA + (chevron - 1) * numericConfig.paStep;
    return Number.isFinite(pa) ? pa : null;
  };

  const generateResults = () => {
    const compiled: APAResult[] = [];

    tiles.forEach((tile, index) => {
      const chevron = parseInt(tile.chevron, 10);
      const flow = parseFloat(tile.flow);

      if (!Number.isFinite(chevron) || chevron <= 0) return;
      if (!Number.isFinite(flow)) return;

      const pa = getTilePA(tile.chevron);
      if (pa === null) return;

      const col = index % speeds.length;
      const row = Math.floor(index / speeds.length);

      compiled.push({
        tile: index + 1,
        speed: speeds[col],
        accel: accelerations[row],
        flow,
        chevron,
        pa,
      });
    });

    compiled.sort((a, b) => a.flow - b.flow);
    setResults(compiled);
  };

  const apaOutput = useMemo(() => {
    if (!results.length) return '';
    return results
      .map((result) => `${result.pa.toFixed(6)},${result.flow.toFixed(2)},${result.accel}`)
      .join('\n');
  }, [results]);

  const handleCopy = async () => {
    if (!apaOutput) return;
    try {
      await navigator.clipboard.writeText(apaOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy APA output', error);
    }
  };

  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="info" title="How to score each tile">
        <ul className="text-xs space-y-1">
          <li><strong>Best Chevron:</strong> No bulge, no bite-out, consistent line width.</li>
          <li><strong>Too Low:</strong> Bulge or pimple right after the corner.</li>
          <li><strong>Too High:</strong> Gaps or concave bite-out at the apex.</li>
        </ul>
      </InfoCard>
      <InfoCard variant="tip" title="Flow estimation">
        <p className="text-xs">
          Flow defaults to calculated volumetric rate for each speed. Adjust with your measured value from the tile label if it differs.
        </p>
      </InfoCard>
      <InfoCard variant="warning" title="Before you start">
        <ul className="text-xs space-y-1">
          <li>• Use fresh nozzle calibration and a consistent filament path.</li>
          <li>• Disable pressure advance in firmware while running the test.</li>
          <li>• Print on a stable surface to avoid ringing artifacts.</li>
        </ul>
      </InfoCard>
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Move3D className="w-6 h-6" />}
      title="PA Pattern Calibration"
      description="Record Adaptive Pressure Advance values from the 3×3 pattern test grid"
      onNavigate={onNavigate}
      docPath="/docs/orca-slicer/calibration/adaptive-pressure-advance-calibration.md"
      badge={{ text: 'Experimental', variant: 'outline' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <div className="space-y-6">
          <FormSection
            title="Pattern files"
            description="Download ready-to-print assets from OrcaSlicer for the Adaptive Pressure Advance pattern"
          >
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="gap-2">
                <a href={patternAssets.project} download>
                  <Download className="h-4 w-4" />
                  PA Pattern Project (.3mf)
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={patternAssets.stl} download>
                  <Download className="h-4 w-4" />
                  Pattern STL (.stl)
                </a>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <a href={patternAssets.tower} download>
                  <Download className="h-4 w-4" />
                  Tower with Seam STL
                </a>
              </Button>
            </div>
          </FormSection>

          <FormSection
            title="Test configuration"
            description="Set the PA sweep and volumetric defaults for the printed tiles"
          >
            <FieldGroup>
              <TextField
                id="start-pa"
                label="Start PA"
                type="number"
                value={config.startPA}
                onChange={(value) => handleConfigChange('startPA', value)}
                step={0.001}
              />
              <TextField
                id="end-pa"
                label="End PA"
                type="number"
                value={config.endPA}
                onChange={(value) => handleConfigChange('endPA', value)}
                step={0.001}
              />
              <TextField
                id="pa-step"
                label="PA Step"
                type="number"
                value={config.paStep}
                onChange={(value) => handleConfigChange('paStep', value)}
                step={0.001}
              />
              <TextField
                id="layer-height"
                label="Layer Height"
                type="number"
                value={config.layerHeight}
                onChange={(value) => handleConfigChange('layerHeight', value)}
                step={0.01}
                unit="mm"
              />
              <TextField
                id="line-width"
                label="Line Width"
                type="number"
                value={config.lineWidth}
                onChange={(value) => handleConfigChange('lineWidth', value)}
                step={0.01}
                unit="mm"
              />
            </FieldGroup>
          </FormSection>

          <FormSection
            title="Record best tile values"
            description="Enter the winning chevron and measured flow from each printed tile"
          >
            <div className="grid gap-4 lg:grid-cols-3">
              {tiles.map((tile, index) => {
                const col = index % speeds.length;
                const row = Math.floor(index / speeds.length);
                const paValue = getTilePA(tile.chevron);
                const estimatedFlow = estimateFlow(
                  speeds[col],
                  numericConfig.layerHeight,
                  numericConfig.lineWidth,
                );

                return (
                  <Card key={index} className="border-muted">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Tile {index + 1}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {speeds[col]} mm/s · {accelerations[row]} mm/s²
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <TextField
                        id={`chevron-${index}`}
                        label="Best Chevron"
                        type="number"
                        value={tile.chevron}
                        onChange={(value) => handleTileChange(index, 'chevron', value)}
                        helperText="Use the number printed next to the best corner"
                        min={1}
                        max={30}
                      />
                      <TextField
                        id={`flow-${index}`}
                        label="Flow"
                        type="number"
                        value={tile.flow}
                        onChange={(value) => handleTileChange(index, 'flow', value)}
                        helperText={`Suggested: ${estimatedFlow ? estimatedFlow.toFixed(2) : '0.00'} mm³/s`}
                        step={0.01}
                        unit="mm³/s"
                      />
                      <Separator />
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          Calculated PA
                        </p>
                        <p className="text-lg font-semibold">
                          {paValue !== null ? paValue.toFixed(6) : '—'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </FormSection>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Enter chevron and flow for each tile, then generate the Adaptive Pressure Advance table.
            </p>
            <Button onClick={generateResults} className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Generate APA Table
            </Button>
          </div>

          {results.length > 0 && (
            <FormSection title="Adaptive Pressure Advance output">
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-muted">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-2 font-medium">Tile</th>
                        <th className="px-4 py-2 font-medium">Speed (mm/s)</th>
                        <th className="px-4 py-2 font-medium">Accel (mm/s²)</th>
                        <th className="px-4 py-2 font-medium">Flow (mm³/s)</th>
                        <th className="px-4 py-2 font-medium">Chevron</th>
                        <th className="px-4 py-2 font-medium">PA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result.tile} className="border-t border-muted/60">
                          <td className="px-4 py-2">Tile {result.tile}</td>
                          <td className="px-4 py-2">{result.speed}</td>
                          <td className="px-4 py-2">{result.accel}</td>
                          <td className="px-4 py-2">{result.flow.toFixed(2)}</td>
                          <td className="px-4 py-2">{result.chevron}</td>
                          <td className="px-4 py-2">{result.pa.toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">APA entries (PA, Flow, Accel)</p>
                    <Button
                      size="sm"
                      variant={copied ? 'secondary' : 'default'}
                      onClick={handleCopy}
                      className="gap-2"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-mono text-primary-foreground/80 bg-background/70 p-3 rounded-md border border-primary/30">
                    {apaOutput}
                  </pre>
                </div>
              </div>
            </FormSection>
          )}
        </div>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default PressureAdvancePattern;
