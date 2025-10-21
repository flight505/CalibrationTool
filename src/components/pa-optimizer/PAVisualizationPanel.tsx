import { FormSection, InfoCard } from '@/components/calibration/CalibrationToolLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import type { PAAnalysisResult, PATestConfig } from '@/lib/pa-optimizer';

interface PAVisualizationPanelProps {
  analysis: PAAnalysisResult;
  config: PATestConfig;
}

export const PAVisualizationPanel: React.FC<PAVisualizationPanelProps> = ({ analysis, config }) => {
  const { testData, selectedModel, statistics, outliers } = analysis;

  // Create outlier lookup for easy checking
  const outlierSet = new Set(
    outliers.filter(o => o.isOutlier).map(o => o.tileId)
  );

  // Prepare data for Flow vs PA chart
  const flowVsPAData = testData.map(d => ({
    flow: d.flow,
    measured: d.paValue,
    predicted: selectedModel.predict(d.flow, d.accel),
    accel: d.accel,
    tileId: d.tileId,
    isOutlier: outlierSet.has(d.tileId),
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
      isOutlier: outlierSet.has(d.tileId),
    };
  });

  // Before vs After comparison
  const comparisonData = testData.map(d => ({
    tileId: d.tileId,
    measured: d.paValue,
    optimized: selectedModel.predict(d.flow, d.accel),
    isOutlier: outlierSet.has(d.tileId),
  }));

  // Extended range visualization data
  const calibratedSpeedRange = [
    Math.min(...testData.map(d => d.speed)),
    Math.max(...testData.map(d => d.speed)),
  ];

  // Generate extended model curve (25 mm/s to 350 mm/s)
  const extendedCurveData = [];
  // Use actual layer height and line width from config
  const { layerHeight, lineWidth } = config;
  for (let speed = 25; speed <= 350; speed += 5) {
    const flow = (speed * layerHeight * lineWidth) / 60;
    const avgAccel = (Math.min(...testData.map(d => d.accel)) + Math.max(...testData.map(d => d.accel))) / 2;
    const prediction = selectedModel.predict(flow, avgAccel);
    extendedCurveData.push({
      speed,
      flow,
      paValue: Math.max(0.001, Math.min(1.0, prediction)),
      isCalibrated: speed >= calibratedSpeedRange[0] && speed <= calibratedSpeedRange[1],
    });
  }

  const chartConfig = {
    measured: {
      label: "Measured PA",
      color: "hsl(var(--chart-1))",
    },
    predicted: {
      label: "Model Prediction",
      color: "hsl(var(--chart-2))",
    },
    modelPrediction: {
      label: "Model Prediction",
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

                  {/* Regular measured points colored by acceleration */}
                  <Scatter
                    name="Measured (4000 mm/s²)"
                    data={flowVsPAData.filter(d => d.accel === uniqueAccels[0] && !d.isOutlier)}
                    fill="hsl(var(--chart-1))"
                    shape="circle"
                  />
                  {uniqueAccels.length > 1 && (
                    <Scatter
                      name="Measured (6000 mm/s²)"
                      data={flowVsPAData.filter(d => d.accel === uniqueAccels[1] && !d.isOutlier)}
                      fill="hsl(var(--chart-2))"
                      shape="triangle"
                    />
                  )}
                  {uniqueAccels.length > 2 && (
                    <Scatter
                      name="Measured (10000 mm/s²)"
                      data={flowVsPAData.filter(d => d.accel === uniqueAccels[2] && !d.isOutlier)}
                      fill="hsl(var(--chart-3))"
                      shape="square"
                    />
                  )}

                  {/* Outlier points in red with X markers */}
                  {flowVsPAData.filter(d => d.isOutlier).length > 0 && (
                    <Scatter
                      name="Outliers"
                      data={flowVsPAData.filter(d => d.isOutlier)}
                      fill="hsl(var(--destructive))"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      shape="cross"
                      r={6}
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
                    name="Residual"
                    radius={[4, 4, 0, 0]}
                  >
                    {residualsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isOutlier ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))'}
                      />
                    ))}
                  </Bar>
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

      {/* Extended Range Prediction */}
      <FormSection title="Extended Speed Range Prediction">
        <Card>
          <CardHeader>
            <CardTitle>PA vs Speed (Full Range with Extrapolation)</CardTitle>
            <CardDescription>
              Model predictions across 25-350 mm/s showing calibrated region and extrapolations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={extendedCurveData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />

                  {/* Shaded calibrated region */}
                  <ReferenceArea
                    x1={calibratedSpeedRange[0]}
                    x2={calibratedSpeedRange[1]}
                    fill="hsl(var(--primary))"
                    fillOpacity={0.1}
                    label={{ value: 'Calibrated Region', position: 'top', fill: 'hsl(var(--primary))' }}
                  />

                  <XAxis
                    dataKey="speed"
                    type="number"
                    domain={[0, 350]}
                    label={{ value: 'Print Speed (mm/s)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis
                    label={{ value: 'PA Value', angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">Speed:</span>
                                <span className="text-xs font-bold">{data.speed} mm/s</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">Flow:</span>
                                <span className="text-xs">{data.flow.toFixed(2)} mm³/s</span>
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground">PA:</span>
                                <span className="text-xs font-bold">{data.paValue.toFixed(4)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={data.isCalibrated ? 'default' : 'outline'} className="text-xs">
                                  {data.isCalibrated ? 'Calibrated' : 'Extrapolated'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="paValue"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={3}
                    dot={false}
                    name="Model Prediction"
                  />

                  {/* Overlay measured points */}
                  <Scatter
                    name="Test Points"
                    data={testData.map(d => ({
                      speed: d.speed,
                      paValue: d.paValue,
                      isOutlier: outlierSet.has(d.tileId),
                      tileId: d.tileId
                    }))}
                    fill="hsl(var(--chart-1))"
                    line={false}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      if (!cx || !cy || payload.isOutlier === undefined) {
                        return <circle cx={0} cy={0} r={0} />;
                      }
                      if (payload.isOutlier) {
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={7} fill="hsl(var(--destructive))" stroke="white" strokeWidth={2} />
                            <text x={cx} y={cy - 12} textAnchor="middle" fontSize="10" fill="hsl(var(--destructive))">
                              {payload.tileId}
                            </text>
                          </g>
                        );
                      }
                      return (
                        <g>
                          <circle cx={cx} cy={cy} r={6} fill="hsl(var(--chart-1))" stroke="white" strokeWidth={2} />
                          <text x={cx} y={cy - 10} textAnchor="middle" fontSize="9" fill="hsl(var(--foreground))">
                            {payload.tileId}
                          </text>
                        </g>
                      );
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>

            <InfoCard variant="info">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary/10 border-2 border-primary" />
                  <span><strong>Calibrated Region:</strong> {calibratedSpeedRange[0]}-{calibratedSpeedRange[1]} mm/s (based on your test data)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-muted border border-muted-foreground" />
                  <span><strong>Extrapolated Region:</strong> Predictions beyond calibrated range (use with caution)</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  <strong>Note:</strong> This chart shows predictions at average acceleration ({((Math.min(...testData.map(d => d.accel)) + Math.max(...testData.map(d => d.accel))) / 2).toFixed(0)} mm/s²)
                  using layer height {layerHeight} mm and line width {lineWidth} mm.
                  Actual PA values will vary with acceleration.
                </p>
              </div>
            </InfoCard>
          </CardContent>
        </Card>
      </FormSection>

      {/* Before/After Comparison */}
      <FormSection title="Measured vs Model Predictions">
        <Card>
          <CardHeader>
            <CardTitle>Measured vs Model-Predicted Values</CardTitle>
            <CardDescription>
              Comparison of actual measurements vs model predictions (not corrections)
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
                    name="Measured PA"
                    radius={[4, 4, 0, 0]}
                  >
                    {comparisonData.map((entry, index) => (
                      <Cell
                        key={`measured-${index}`}
                        fill={entry.isOutlier ? 'hsl(var(--destructive) / 0.5)' : 'hsl(var(--chart-1))'}
                      />
                    ))}
                  </Bar>
                  <Bar
                    dataKey="optimized"
                    name="Model Prediction"
                    radius={[4, 4, 0, 0]}
                  >
                    {comparisonData.map((entry, index) => (
                      <Cell
                        key={`predicted-${index}`}
                        fill={entry.isOutlier ? 'hsl(var(--destructive))' : 'hsl(var(--chart-3))'}
                      />
                    ))}
                  </Bar>
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
