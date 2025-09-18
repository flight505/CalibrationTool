import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  ExperimentFactor,
  ExperimentRun,
  MainEffectAnalysis,
  SNRAnalysis,
  TestModel,
  TestModelType
} from '@/utils/doe/doeTypes';
import { TEST_MODELS, DOE_TEMPLATES } from '@/utils/doe/testModels';
import { ExperimentPlanner } from '@/utils/doe/experimentPlanner';
import { FACTOR_LIBRARY, createFactorFromPreset, expandTemplateFactor } from '@/utils/doe/factorLibrary';
import { calculateANOVA, calculateMainEffects, calculateSignalToNoise, predictOptimalSettings } from '@/utils/doe/analysis';
import type { ResponseType } from '@/utils/doe/doeTypes';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';

interface GeneratedFile {
  filename: string;
  downloadUrl: string;
  runNumber: number;
}

const ARRAY_TYPES: Array<'L9' | 'L18' | 'L27'> = ['L9', 'L18', 'L27'];
const STORAGE_KEY = 'doe-workbench-state';

const metricLabel = (metric: TestModel['metrics'][number]) =>
  `${metric.name} (${metric.responseType.replace(/-/g, ' ')})`;

const formatNumber = (value: number) =>
  Number.isFinite(value) ? value.toFixed(3).replace(/\.000$/, '') : '–';

const DOEWorkbench: React.FC = () => {
  const [experimentName, setExperimentName] = useState('DOE Experiment');
  const [description, setDescription] = useState('');
  const [arrayType, setArrayType] = useState<'L9' | 'L18' | 'L27'>('L9');
  const [testModelId, setTestModelId] = useState<TestModelType>('calibration_cube');
  const [factors, setFactors] = useState<ExperimentFactor[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [runs, setRuns] = useState<ExperimentRun[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedMetricId, setSelectedMetricId] = useState<string>('');
  const [mainEffects, setMainEffects] = useState<MainEffectAnalysis[]>([]);
  const [snrResults, setSnrResults] = useState<SNRAnalysis[]>([]);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [anovaSummary, setAnovaSummary] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<string>('');
  const plannerRef = useRef<ExperimentPlanner | null>(null);
  const urlCache = useRef<string[]>([]);
  const csvDownloadUrl = useRef<string | null>(null);
  const hydratedRef = useRef<boolean>(false);

  const testModel = TEST_MODELS[testModelId];

  useEffect(() => {
    return () => {
      urlCache.current.forEach((url) => URL.revokeObjectURL(url));
      urlCache.current = [];
      if (csvDownloadUrl.current) {
        URL.revokeObjectURL(csvDownloadUrl.current);
        csvDownloadUrl.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        hydratedRef.current = true;
        return;
      }
      const saved = JSON.parse(raw);
      if (saved.experimentName) {
        setExperimentName(saved.experimentName);
      }
      if (saved.description) {
        setDescription(saved.description);
      }
      if (saved.arrayType && ARRAY_TYPES.includes(saved.arrayType)) {
        setArrayType(saved.arrayType);
      }
      if (saved.testModelId && TEST_MODELS[saved.testModelId as TestModelType]) {
        setTestModelId(saved.testModelId);
      }
      if (Array.isArray(saved.factors)) {
        const restored = saved.factors.filter((factor: any) =>
          factor && typeof factor.name === 'string' && Array.isArray(factor.levels)
        ) as ExperimentFactor[];
        if (restored.length) {
          setFactors(restored);
        }
      }
    } catch (error) {
      console.warn('Failed to restore DOE workbench state', error);
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydratedRef.current) return;

    const payload = {
      experimentName,
      description,
      arrayType,
      testModelId,
      factors
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('Failed to persist DOE workbench state', error);
    }
  }, [experimentName, description, arrayType, testModelId, factors]);

  useEffect(() => {
    setSelectedMetricId(testModel.metrics[0]?.id || '');
  }, [testModelId, testModel.metrics]);

  const availableFactorPresets = useMemo(
    () => Object.values(FACTOR_LIBRARY),
    []
  );

  const handleAddFactor = (presetId: string) => {
    const existing = factors.find((factor) => factor.parameter === FACTOR_LIBRARY[presetId]?.parameter);
    if (existing) return;

    const factor = createFactorFromPreset(presetId);
    if (factor) {
      setFactors((prev) => [...prev, factor]);
    }
  };

  const handleRemoveFactor = (parameter: string) => {
    setFactors((prev) => prev.filter((factor) => factor.parameter !== parameter));
  };

  const handleUpdateFactorLevels = (parameter: string, value: string) => {
    const levels = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => Number.parseFloat(item))
      .filter((num) => Number.isFinite(num));

    if (!levels.length) {
      return;
    }

    setFactors((prev) =>
      prev.map((factor) =>
        factor.parameter === parameter
          ? { ...factor, levels }
          : factor
      )
    );
  };

  const handleApplyTemplate = (templateId: string) => {
    const normalizedId = templateId === 'none' ? '' : templateId;
    setSelectedPreset(normalizedId);

    if (!normalizedId) {
      return;
    }

    const template = DOE_TEMPLATES[normalizedId as keyof typeof DOE_TEMPLATES];
    if (!template) {
      return;
    }

    setExperimentName(template.name);
    setDescription(template.description);
    setArrayType(template.arrayType);
    setTestModelId(template.testModel);

    const expandedFactors = template.factors
      .map((factorConfig) => expandTemplateFactor(factorConfig))
      .filter((factor): factor is ExperimentFactor => Boolean(factor));

    setFactors(expandedFactors);
  };

  const resetGeneratedArtifacts = () => {
    urlCache.current.forEach((url) => URL.revokeObjectURL(url));
    urlCache.current = [];
    if (csvDownloadUrl.current) {
      URL.revokeObjectURL(csvDownloadUrl.current);
      csvDownloadUrl.current = null;
    }
    setGeneratedFiles([]);
    setRuns([]);
    setMainEffects([]);
    setSnrResults([]);
    setAnovaSummary('');
    setCsvPreview('');
  };

  const handleGenerateExperiment = async () => {
    if (!factors.length) {
      setGenerationError('Select at least one factor before generating.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    resetGeneratedArtifacts();

    try {
      const planner = new ExperimentPlanner(
        experimentName,
        description,
        arrayType,
        testModelId,
        factors
      );

      plannerRef.current = planner;
      const files = await planner.generateAll3MFFiles();
      const csv = planner.exportToCSV();
      setCsvPreview(csv);
      const experiment = planner.getExperiment();

      const generated = files
        .filter((file) => file.generated && file.downloadUrl)
        .map((file) => {
          if (file.downloadUrl) {
            urlCache.current.push(file.downloadUrl);
          }
          return {
            filename: file.filename,
            downloadUrl: file.downloadUrl!,
            runNumber: experiment.runs.find((run) => run.testFile?.filename === file.filename)?.runNumber || 0
          };
        });

      setGeneratedFiles(generated);
      setRuns(experiment.runs);
    } catch (error: any) {
        console.error('Failed to generate DOE experiment:', error);
        setGenerationError(error?.message || 'Failed to generate experiment.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMeasurementChange = (runNumber: number, metricId: string, value: string) => {
    const numericValue = Number.parseFloat(value);
    setRuns((prevRuns) =>
      prevRuns.map((run) => {
        if (run.runNumber !== runNumber) {
          return run;
        }

        const existing = { ...(run.measurements ?? {}) } as Record<string, number>;

        if (Number.isFinite(numericValue)) {
          existing[metricId] = numericValue;
        } else if (metricId in existing) {
          delete existing[metricId];
        }

        return {
          ...run,
          measurements: existing
        };
      })
    );
  };

  const handleDownloadCSV = () => {
    if (!plannerRef.current) return;
    const csv = plannerRef.current.exportToCSV();
    if (csvDownloadUrl.current) {
      URL.revokeObjectURL(csvDownloadUrl.current);
      csvDownloadUrl.current = null;
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    csvDownloadUrl.current = url;
    const link = document.createElement('a');
    link.href = url;
    const filenameSafe = experimentName.trim().length ? experimentName.trim().replace(/\s+/g, '_') : 'DOE_Experiment';
    link.download = `${filenameSafe}_design.csv`;
    link.click();
  };

  const handleCopyCsv = async () => {
    if (!csvPreview || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(csvPreview);
    } catch (error) {
      console.warn('Failed to copy CSV to clipboard', error);
    }
  };

  const computeAnalysis = () => {
    if (!selectedMetricId) {
      setAnalysisError('Select a metric to analyze.');
      return;
    }

    const metric = testModel.metrics.find((item) => item.id === selectedMetricId);
    if (!metric) {
      setAnalysisError('Metric definition not found for analysis.');
      return;
    }

    const completedRuns = runs.filter(
      (run) => typeof run.measurements?.[selectedMetricId] === 'number' && !Number.isNaN(run.measurements![selectedMetricId]!)
    );

    if (completedRuns.length < factors.length) {
      setAnalysisError('Enter measurements for all runs before analysis.');
      return;
    }

    setAnalysisError(null);

    const mainEffectData = calculateMainEffects(completedRuns, factors, selectedMetricId);
    const snrData = calculateSignalToNoise(
      completedRuns,
      factors,
      selectedMetricId,
      metric.responseType as ResponseType,
      metric.target
    );

    const optimal = predictOptimalSettings(mainEffectData);
    const anova = calculateANOVA(completedRuns, factors, selectedMetricId);

    const summaryLines: string[] = [];
    summaryLines.push(`Total Sum of Squares: ${formatNumber(anova.totalSS)}`);
    summaryLines.push('Factor Contributions:');
    anova.sources.forEach((source) => {
      summaryLines.push(
        ` - ${source.name}: ${formatNumber(source.contribution)}% (F=${formatNumber(source.fValue ?? NaN)})`
      );
    });

    summaryLines.push('Suggested optimal levels:');
    Object.entries(optimal).forEach(([factorName, level]) => {
      summaryLines.push(` - ${factorName}: ${level}`);
    });

    setMainEffects(mainEffectData);
    setSnrResults(snrData);
    setAnovaSummary(summaryLines.join('\n'));
  };

  const resetAll = () => {
    plannerRef.current = null;
    setExperimentName('DOE Experiment');
    setDescription('');
    setArrayType('L9');
    setTestModelId('calibration_cube');
    setFactors([]);
    setSelectedPreset('');
    resetGeneratedArtifacts();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  };

  const selectedMetric = testModel.metrics.find((metric) => metric.id === selectedMetricId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Design of Experiments Workbench</CardTitle>
          <CardDescription>
            Configure Taguchi-based experiments, generate printable batches, and analyze calibration data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experiment-name">Experiment Name</Label>
              <Input
                id="experiment-name"
                value={experimentName}
                onChange={(event) => setExperimentName(event.target.value)}
                placeholder="PLA Quality DOE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="array-type">Orthogonal Array</Label>
              <Select value={arrayType} onValueChange={(value) => setArrayType(value as typeof arrayType)}>
                <SelectTrigger id="array-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ARRAY_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} ({type === 'L9' ? '9 runs' : type === 'L18' ? '18 runs' : '27 runs'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Objective / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Document the goal of this experiment"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-model">Test Model</Label>
              <Select value={testModelId} onValueChange={(value) => setTestModelId(value as TestModelType)}>
                <SelectTrigger id="test-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(TEST_MODELS).map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">{testModel.description}</p>
            </div>

            <div className="space-y-2">
              <Label>Experiment Templates</Label>
              <Select value={selectedPreset || 'none'} onValueChange={handleApplyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No template</SelectItem>
                  {Object.values(DOE_TEMPLATES).map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPreset && (
                <p className="text-xs text-muted-foreground">
                  Template applied. Adjust factor levels or add additional factors as required.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factor Selection</CardTitle>
          <CardDescription>Select controllable variables and specify their levels.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-3">
            {availableFactorPresets.map((preset) => {
              const isSelected = factors.some((factor) => factor.parameter === preset.parameter);
              return (
                <Card key={preset.id} className={isSelected ? 'border-primary' : ''}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base">{preset.name}</CardTitle>
                    <CardDescription>{preset.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Levels: {preset.defaultLevels.join(', ')}</span>
                    <Button
                      size="sm"
                      variant={isSelected ? 'secondary' : 'default'}
                      onClick={() => (isSelected ? handleRemoveFactor(preset.parameter) : handleAddFactor(preset.id))}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {factors.length === 0 && (
            <Alert>
              <AlertTitle>No factors selected</AlertTitle>
              <AlertDescription>
                Choose at least one factor to include in the orthogonal array.
              </AlertDescription>
            </Alert>
          )}

          {factors.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">Selected Factors</h3>
              <div className="space-y-3">
                {factors.map((factor) => (
                  <div key={factor.parameter} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{factor.name}</p>
                        <p className="text-sm text-muted-foreground">Parameter: {factor.parameter} | Unit: {factor.unit || 'value'}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveFactor(factor.parameter)}>
                        Remove
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground">Levels</Label>
                      <Input
                        value={factor.levels.join(', ')}
                        onChange={(event) => handleUpdateFactorLevels(factor.parameter, event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Comma-separated numeric values (3 levels recommended for Taguchi arrays).</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGenerateExperiment} disabled={isGenerating}>
              {isGenerating ? 'Generating…' : 'Generate DOE Batch'}
            </Button>
            <Button variant="outline" onClick={resetAll} disabled={isGenerating}>
              Reset
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem(STORAGE_KEY);
                }
              }}
              disabled={isGenerating}
            >
              Clear Saved Setup
            </Button>
            {generationError && (
              <Alert className="w-full">
                <AlertDescription>{generationError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Experiment Matrix Preview</CardTitle>
            <CardDescription>Orthogonal array layout for the current experiment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-4">Run</th>
                    {factors.map((factor) => (
                      <th key={factor.parameter} className="py-2 pr-4">
                        {factor.name} ({factor.unit || 'value'})
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={`matrix-${run.runNumber}`} className="border-b last:border-none">
                      <td className="py-2 pr-4 font-medium">#{run.runNumber}</td>
                      {factors.map((factor) => (
                        <td key={`${run.runNumber}-${factor.parameter}`} className="py-2 pr-4">
                          {run.factorSettings[factor.name] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={handleDownloadCSV}>
                Download CSV
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyCsv} disabled={!csvPreview}>
                Copy CSV
              </Button>
            </div>

            {csvPreview && (
              <pre className="max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs whitespace-pre-wrap">
                {csvPreview}
              </pre>
            )}
          </CardContent>
        </Card>
      )}

      {runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Experimental Runs & Files</CardTitle>
            <CardDescription>Download 3MF files and record measurements for each run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="max-h-[380px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Run</th>
                    <th className="py-2 pr-3">Factors</th>
                    <th className="py-2 pr-3">Download</th>
                    {testModel.metrics.length > 0 && (
                      <th className="py-2 pr-3">Measurement ({metricLabel(testModel.metrics.find((metric) => metric.id === selectedMetricId) || testModel.metrics[0])})</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const file = generatedFiles.find((item) => item.runNumber === run.runNumber);
                    return (
                      <tr key={run.runNumber} className="border-b last:border-none">
                        <td className="py-2 pr-3 font-medium">#{run.runNumber}</td>
                        <td className="py-2 pr-3">
                          <div className="space-y-1">
                            {Object.entries(run.factorSettings).map(([factorName, value]) => (
                              <div key={factorName} className="text-muted-foreground">
                                {factorName}: <span className="text-foreground font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          {file ? (
                            <Button size="sm" asChild>
                              <a href={file.downloadUrl} download={file.filename}>Download</a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not generated</span>
                          )}
                        </td>
                        {testModel.metrics.length > 0 && (
                          <td className="py-2 pr-3">
                            <Input
                              type="number"
                              value={run.measurements?.[selectedMetricId] ?? ''}
                              onChange={(event) => handleMeasurementChange(run.runNumber, selectedMetricId, event.target.value)}
                              placeholder="Enter value"
                              className="w-40"
                              step="0.01"
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </ScrollArea>

            {testModel.metrics.length > 0 && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Metric for Analysis</Label>
                  <Select value={selectedMetricId} onValueChange={setSelectedMetricId}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      {testModel.metrics.map((metric) => (
                        <SelectItem key={metric.id} value={metric.id}>
                          {metricLabel(metric)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={computeAnalysis}>Analyze Results</Button>
              </div>
            )}

            {selectedMetric && (
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                <div>
                  <span className="text-sm font-semibold">Metric Details:</span>
                  <p className="text-sm text-muted-foreground">{selectedMetric.description}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Response: {selectedMetric.responseType.replace(/-/g, ' ')}</span>
                  {selectedMetric.unit && <span>Unit: {selectedMetric.unit}</span>}
                  {typeof selectedMetric.target === 'number' && (
                    <span>Target: {selectedMetric.target}</span>
                  )}
                  {typeof selectedMetric.minValue === 'number' && typeof selectedMetric.maxValue === 'number' && (
                    <span>Range: {selectedMetric.minValue} – {selectedMetric.maxValue}</span>
                  )}
                </div>
                {selectedMetric.scoringRubric && (
                  <div className="text-xs">
                    <p className="font-semibold">Scoring Rubric:</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      {Object.entries(selectedMetric.scoringRubric).map(([scoreKey, text]) => (
                        <li key={scoreKey}>
                          <span className="font-medium uppercase mr-1">{scoreKey.replace('score', 'Score ')}</span>
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {analysisError && (
              <Alert>
                <AlertDescription>{analysisError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {mainEffects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>DOE Analysis</CardTitle>
            <CardDescription>Main effects, signal-to-noise ratios, and ANOVA summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Main Effects</h3>
              <div className="overflow-x-auto">
                <table className="min-w-[480px] text-sm mt-2">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Factor</th>
                      <th className="py-2 pr-4">Levels</th>
                      <th className="py-2 pr-4">Means</th>
                      <th className="py-2 pr-4">Effect</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mainEffects.map((effect) => (
                      <tr key={effect.factor} className="border-b last:border-none">
                        <td className="py-2 pr-4 font-medium">{effect.factor}</td>
                        <td className="py-2 pr-4">{effect.levels.join(', ')}</td>
                        <td className="py-2 pr-4">{effect.means.map(formatNumber).join(', ')}</td>
                        <td className="py-2 pr-4">{formatNumber(effect.effect)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold">Signal-to-Noise Ratios</h3>
              <div className="overflow-x-auto">
                <table className="min-w-[480px] text-sm mt-2">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="py-2 pr-4">Factor</th>
                      <th className="py-2 pr-4">SNR Values</th>
                      <th className="py-2 pr-4">Optimal Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snrResults.map((snr) => (
                      <tr key={snr.factor} className="border-b last:border-none">
                        <td className="py-2 pr-4 font-medium">{snr.factor}</td>
                        <td className="py-2 pr-4">{snr.snrValues.map(formatNumber).join(', ')}</td>
                        <td className="py-2 pr-4">{snr.optimalLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {anovaSummary && (
              <div>
                <h3 className="text-lg font-semibold">ANOVA Summary</h3>
                <pre className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap">{anovaSummary}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DOEWorkbench;
