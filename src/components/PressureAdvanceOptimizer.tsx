import { useState, useMemo } from 'react';
import { Move3D, BarChart3, Activity, FileDown, LineChart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { CalibrationToolLayout, TwoColumnLayout, InfoCard } from '@/components/calibration/CalibrationToolLayout';

import { PAInputPanel } from './pa-optimizer/PAInputPanel';
import { PAAnalysisPanel } from './pa-optimizer/PAAnalysisPanel';
import { PAModelingPanel } from './pa-optimizer/PAModelingPanel';
import { PAResultsPanel } from './pa-optimizer/PAResultsPanel';
import { PAVisualizationPanel } from './pa-optimizer/PAVisualizationPanel';

import { analyzePA } from '@/lib/pa-optimizer';
import type { PATestConfig, PATestResult, PAAnalysisResult, ModelType } from '@/lib/pa-optimizer';

interface PressureAdvanceOptimizerProps {
  onNavigate?: (tool: string, path?: string) => void;
}

// Example data for demonstration - Real-world data with potential outliers
const EXAMPLE_DATA: PATestResult[] = [
  { tileId: 1, speed: 120, flow: 9.75, accel: 4000, paValue: 0.025 },
  { tileId: 2, speed: 150, flow: 12.16, accel: 4000, paValue: 0.030 },
  { tileId: 3, speed: 200, flow: 16.25, accel: 4000, paValue: 0.025 },
  { tileId: 4, speed: 120, flow: 9.75, accel: 6000, paValue: 0.015 },
  { tileId: 5, speed: 150, flow: 12.19, accel: 6000, paValue: 0.015 },
  { tileId: 6, speed: 200, flow: 16.28, accel: 6000, paValue: 0.020 },
  { tileId: 7, speed: 120, flow: 9.75, accel: 10000, paValue: 0.010 },
  { tileId: 8, speed: 150, flow: 12.19, accel: 10000, paValue: 0.015 },
  { tileId: 9, speed: 200, flow: 16.25, accel: 10000, paValue: 0.010 },
];

const DEFAULT_CONFIG: PATestConfig = {
  gridSize: '3x3',
  speeds: [120, 150, 200],
  accelerations: [4000, 6000, 10000],
  startPA: 0.000,
  endPA: 0.028,
  paStep: 0.002,
  layerHeight: 0.16,
  lineWidth: 0.48,
};

const PressureAdvanceOptimizer: React.FC<PressureAdvanceOptimizerProps> = ({ onNavigate }) => {
  const [config, setConfig] = useState<PATestConfig>(DEFAULT_CONFIG);
  const [testData, setTestData] = useState<PATestResult[]>(EXAMPLE_DATA);
  const [activeTab, setActiveTab] = useState('input');
  const [manualModelOverride, setManualModelOverride] = useState<string | null>(null);
  const [outlierCorrectionMode, setOutlierCorrectionMode] = useState<'none' | 'ransac' | 'model'>('none');

  // Run analysis whenever data, model selection, or correction mode changes
  const analysis: PAAnalysisResult | null = useMemo(() => {
    if (testData.length < 3) return null;

    try {
      const preferredModel = (manualModelOverride || undefined) as ModelType | undefined;
      return analyzePA(config, testData, preferredModel, outlierCorrectionMode);
    } catch (error) {
      console.error('Analysis error:', error);
      return null;
    }
  }, [config, testData, manualModelOverride, outlierCorrectionMode]);

  const handleLoadExample = () => {
    setTestData(EXAMPLE_DATA);
    setConfig(DEFAULT_CONFIG);
  };

  const handleClearData = () => {
    setTestData([]);
  };

  const sidebarContent = (
    <div className="space-y-4">
      <InfoCard variant="info" title="Quick Guide">
        <ol className="text-xs space-y-2 list-decimal list-inside">
          <li><strong>Configure:</strong> Enter PA test parameters</li>
          <li><strong>Generate in OrcaSlicer:</strong> Use Calibration → Pressure Advance</li>
          <li><strong>Print & Measure:</strong> Identify tiles with best corner quality</li>
          <li><strong>Input Results:</strong> Enter your test data in the grid</li>
          <li><strong>Analyze:</strong> Review trend validation and quality score</li>
          <li><strong>Get PA Table:</strong> Export optimized adaptive PA table</li>
        </ol>
      </InfoCard>

      <InfoCard variant="tip" title="Expected Trends">
        <ul className="text-xs space-y-1">
          <li>• PA should <strong>decrease</strong> with higher flow</li>
          <li>• PA should <strong>decrease</strong> with higher acceleration</li>
          <li>• Inverted trends indicate measurement issues</li>
        </ul>
      </InfoCard>

      <InfoCard variant="success" title="Quality Score">
        <ul className="text-xs space-y-1">
          <li>• <strong>80-100:</strong> Excellent calibration</li>
          <li>• <strong>60-80:</strong> Good, minor improvements possible</li>
          <li>• <strong>&lt;60:</strong> Consider re-running test</li>
        </ul>
      </InfoCard>

      {analysis && (
        <InfoCard
          variant={
            analysis.qualityScore.confidence === 'high' ? 'success' :
            analysis.qualityScore.confidence === 'medium' ? 'warning' : 'warning'
          }
          title="Current Score"
        >
          <div className="text-center">
            <div className="text-3xl font-bold mb-1">
              {analysis.qualityScore.overallScore.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">
              {analysis.qualityScore.confidence} Confidence
            </div>
          </div>
        </InfoCard>
      )}
    </div>
  );

  return (
    <CalibrationToolLayout
      icon={<Move3D className="w-6 h-6" />}
      title="Pressure Advance Calibration"
      description="Advanced PA calibration with 3×3 pattern testing, intelligent analysis, and tower generation"
      docPath="/docs/orca-slicer/calibration/adaptive-pressure-advance-calibration.md"
      onNavigate={onNavigate}
      badge={{ text: 'Advanced', variant: 'secondary' }}
    >
      <TwoColumnLayout sidebar={sidebarContent}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="input" className="gap-2">
              <Move3D className="h-4 w-4" />
              <span className="hidden sm:inline">Input</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="models" className="gap-2">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Models</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <FileDown className="h-4 w-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="visualize" className="gap-2">
              <LineChart className="h-4 w-4" />
              <span className="hidden sm:inline">Charts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-4">
            <PAInputPanel
              config={config}
              testData={testData}
              onConfigChange={setConfig}
              onTestDataChange={setTestData}
              onLoadExample={handleLoadExample}
              onClearData={handleClearData}
            />

            {testData.length >= 3 && (
              <div className="flex justify-end">
                <Button onClick={() => setActiveTab('analysis')}>
                  Continue to Analysis →
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {analysis ? (
              <>
                <PAAnalysisPanel analysis={analysis} />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('input')}>
                    ← Back to Input
                  </Button>
                  <Button onClick={() => setActiveTab('models')}>
                    Continue to Models →
                  </Button>
                </div>
              </>
            ) : (
              <InfoCard variant="warning" title="No Analysis Available">
                Please enter at least 3 test results in the Input tab to begin analysis.
              </InfoCard>
            )}
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            {analysis ? (
              <>
                <PAModelingPanel
                  analysis={analysis}
                  selectedModelType={(manualModelOverride as ModelType) || analysis.modelComparison.autoSelectedModel}
                  onModelSelect={setManualModelOverride}
                  outlierCorrectionMode={outlierCorrectionMode}
                  onOutlierCorrectionChange={setOutlierCorrectionMode}
                />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('analysis')}>
                    ← Back to Analysis
                  </Button>
                  <Button onClick={() => setActiveTab('results')}>
                    Continue to Results →
                  </Button>
                </div>
              </>
            ) : (
              <InfoCard variant="warning" title="No Analysis Available">
                Please complete the Input and Analysis steps first.
              </InfoCard>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            {analysis ? (
              <>
                <PAResultsPanel analysis={analysis} />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('models')}>
                    ← Back to Models
                  </Button>
                  <Button onClick={() => setActiveTab('visualize')}>
                    View Visualizations →
                  </Button>
                </div>
              </>
            ) : (
              <InfoCard variant="warning" title="No Results Available">
                Please complete the previous steps to generate results.
              </InfoCard>
            )}
          </TabsContent>

          <TabsContent value="visualize" className="space-y-4">
            {analysis ? (
              <>
                <PAVisualizationPanel analysis={analysis} config={config} />
                <div className="flex justify-start">
                  <Button variant="outline" onClick={() => setActiveTab('results')}>
                    ← Back to Results
                  </Button>
                </div>
              </>
            ) : (
              <InfoCard variant="warning" title="No Data to Visualize">
                Please complete the previous steps to view visualizations.
              </InfoCard>
            )}
          </TabsContent>
        </Tabs>
      </TwoColumnLayout>
    </CalibrationToolLayout>
  );
};

export default PressureAdvanceOptimizer;
