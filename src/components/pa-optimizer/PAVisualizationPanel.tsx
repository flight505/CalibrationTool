import { FormSection } from '@/components/calibration/CalibrationToolLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { PAAnalysisResult } from '@/lib/pa-optimizer';

interface PAVisualizationPanelProps {
  analysis: PAAnalysisResult;
}

export const PAVisualizationPanel: React.FC<PAVisualizationPanelProps> = ({ analysis }) => {
  const { testData, selectedModel, statistics } = analysis;

  // Prepare data for Flow vs PA chart
  const flowVsPAData = testData.map(d => ({
    flow: d.flow,
    measured: d.paValue,
    predicted: selectedModel.predict(d.flow, d.accel),
    accel: d.accel,
    tileId: d.tileId,
  }));

  // Group by acceleration for flow chart
  const uniqueAccels = [...new Set(testData.map(d => d.accel))].sort((a, b) => a - b);

  // Prepare data for Accel vs PA chart
  const uniqueFlows = [...new Set(testData.map(d => d.flow))].sort((a, b) => a - b);
  const accelChartData = uniqueFlows.map(flow => {
    const points = testData.filter(d => Math.abs(d.flow - flow) < 0.1).sort((a, b) => a.accel - b.accel);
    return points.map(p => ({
      accel: p.accel,
      pa: p.paValue,
      predicted: selectedModel.predict(p.flow, p.accel),
      flow: flow,
    }));
  }).flat();

  // Residuals data
  const residualsData = testData.map((d) => {
    const predicted = selectedModel.predict(d.flow, d.accel);
    const residual = d.paValue - predicted;
    return {
      tileId: d.tileId,
      predicted: predicted,
      residual: residual,
      absResidual: Math.abs(residual),
    };
  });

  // Before vs After comparison
  const comparisonData = testData.map(d => ({
    tileId: d.tileId,
    measured: d.paValue,
    optimized: selectedModel.predict(d.flow, d.accel),
  }));

  const chartConfig = {
    measured: {
      label: "Measured PA",
      color: "hsl(var(--chart-1))",
    },
    predicted: {
      label: "Predicted PA",
      color: "hsl(var(--chart-2))",
    },
    optimized: {
      label: "Optimized PA",
      color: "hsl(var(--chart-3))",
    },
    residual: {
      label: "Residual",
      color: "hsl(var(--chart-4))",
    },
  };

  return (
    <div className="space-y-6">
      {/* Flow vs PA Chart */}
      <FormSection title="PA vs Flow Rate">
        <Card>
          <CardHeader>
            <CardTitle>Pressure Advance vs Volumetric Flow</CardTitle>
            <CardDescription>
              PA should decrease with increasing flow (higher speeds push filament faster)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    type="number"
                    dataKey="flow"
                    name="Flow"
                    unit=" mm³/s"
                    domain={['auto', 'auto']}
                    label={{ value: 'Volumetric Flow (mm³/s)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="measured"
                    name="PA"
                    domain={['auto', 'auto']}
                    label={{ value: 'PA Value', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip
                    content={(props) => <ChartTooltipContent {...props} />}
                    cursor={{ strokeDasharray: '3 3' }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />

                  {/* Measured points colored by acceleration */}
                  <Scatter
                    name="Measured (4000 mm/s²)"
                    data={flowVsPAData.filter(d => d.accel === uniqueAccels[0])}
                    fill="hsl(var(--chart-1))"
                    shape="circle"
                  />
                  {uniqueAccels.length > 1 && (
                    <Scatter
                      name="Measured (6000 mm/s²)"
                      data={flowVsPAData.filter(d => d.accel === uniqueAccels[1])}
                      fill="hsl(var(--chart-2))"
                      shape="triangle"
                    />
                  )}
                  {uniqueAccels.length > 2 && (
                    <Scatter
                      name="Measured (10000 mm/s²)"
                      data={flowVsPAData.filter(d => d.accel === uniqueAccels[2])}
                      fill="hsl(var(--chart-3))"
                      shape="square"
                    />
                  )}
                </ScatterChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </FormSection>

      {/* Accel vs PA Chart */}
      <FormSection title="PA vs Acceleration">
        <Card>
          <CardHeader>
            <CardTitle>Pressure Advance vs Acceleration</CardTitle>
            <CardDescription>
              PA should decrease with increasing acceleration (faster movements reduce pressure buildup)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accelChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="accel"
                    label={{ value: 'Acceleration (mm/s²)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'PA Value', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                  />
                  <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <ChartLegend content={<ChartLegendContent />} />

                  <Line
                    type="monotone"
                    dataKey="pa"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-1))', r: 4 }}
                    name="Measured PA"
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: 'hsl(var(--chart-2))', r: 3 }}
                    name="Predicted PA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </FormSection>

      {/* Residuals Chart */}
      <FormSection title="Residual Analysis">
        <Card>
          <CardHeader>
            <CardTitle>Prediction Residuals</CardTitle>
            <CardDescription>
              Difference between measured and predicted values (closer to zero is better)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={residualsData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="tileId"
                    label={{ value: 'Tile ID', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'Residual', angle: -90, position: 'insideLeft' }}
                  />
                  <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />

                  <Bar
                    dataKey="residual"
                    fill="hsl(var(--chart-4))"
                    name="Residual"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/30 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Mean Residual</p>
                <p className="font-mono font-bold">
                  {(residualsData.reduce((sum, d) => sum + d.residual, 0) / residualsData.length).toFixed(6)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Max Absolute</p>
                <p className="font-mono font-bold">
                  {Math.max(...residualsData.map(d => d.absResidual)).toFixed(6)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">RMSE</p>
                <p className="font-mono font-bold">
                  {selectedModel.rmse.toFixed(6)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormSection>

      {/* Before/After Comparison */}
      <FormSection title="Optimization Comparison">
        <Card>
          <CardHeader>
            <CardTitle>Before vs After Optimization</CardTitle>
            <CardDescription>
              Comparison of raw measurements vs model-optimized values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="tileId"
                    label={{ value: 'Tile ID', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'PA Value', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                  />
                  <ChartTooltip content={(props) => <ChartTooltipContent {...props} />} />
                  <ChartLegend content={<ChartLegendContent />} />

                  <Bar
                    dataKey="measured"
                    fill="hsl(var(--chart-1))"
                    name="Measured"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="optimized"
                    fill="hsl(var(--chart-3))"
                    name="Optimized"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-4 p-3 rounded-lg bg-muted/30 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-2">Measured Data</p>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>Mean:</span>
                      <span className="font-bold">{statistics.mean.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Std Dev:</span>
                      <span className="font-bold">{statistics.stdDev.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CV:</span>
                      <span className="font-bold">{statistics.coefficientOfVariation.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Optimized Data</p>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span>Model R²:</span>
                      <span className="font-bold">{selectedModel.r2.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>RMSE:</span>
                      <span className="font-bold">{selectedModel.rmse.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-bold">{selectedModel.modelType.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormSection>
    </div>
  );
};
