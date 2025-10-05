import { TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { FormSection, InfoCard } from '@/components/calibration/CalibrationToolLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PAAnalysisResult } from '@/lib/pa-optimizer';

interface PAAnalysisPanelProps {
  analysis: PAAnalysisResult;
}

export const PAAnalysisPanel: React.FC<PAAnalysisPanelProps> = ({ analysis }) => {
  const { trends, statistics, outliers, qualityScore } = analysis;

  const getTrendIcon = (direction: string) => {
    if (direction === 'correct') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (direction === 'inverted') return <AlertTriangle className="h-5 w-5 text-red-500" />;
    return <Info className="h-5 w-5 text-yellow-500" />;
  };

  const getTrendBadge = (direction: string) => {
    if (direction === 'correct') return <Badge variant="default" className="bg-green-500">Correct</Badge>;
    if (direction === 'inverted') return <Badge variant="destructive">Inverted</Badge>;
    return <Badge variant="outline">Inconsistent</Badge>;
  };

  const outlierTiles = outliers.filter(o => o.isOutlier);

  return (
    <div className="space-y-6">
      {/* Quality Score */}
      <FormSection title="Quality Assessment">
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Overall Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{qualityScore.overallScore}</div>
              <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">
                {qualityScore.confidence} Confidence
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Trend Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityScore.trendScore}/40</div>
              <p className="text-xs text-muted-foreground mt-1">
                Physical trends
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Variability Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityScore.variabilityScore}/30</div>
              <p className="text-xs text-muted-foreground mt-1">
                CV: {statistics.coefficientOfVariation.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Model Fit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{qualityScore.modelFitScore}/30</div>
              <p className="text-xs text-muted-foreground mt-1">
                R²: {analysis.selectedModel.r2.toFixed(3)}
              </p>
            </CardContent>
          </Card>
        </div>

        {qualityScore.warnings.length > 0 && (
          <div className="space-y-2">
            {qualityScore.warnings.map((warning, i) => (
              <InfoCard key={i} variant="warning">
                {warning}
              </InfoCard>
            ))}
          </div>
        )}

        {qualityScore.recommendations.length > 0 && (
          <div className="space-y-2">
            {qualityScore.recommendations.map((rec, i) => (
              <InfoCard key={i} variant={rec.startsWith('✓') ? 'success' : 'tip'}>
                {rec}
              </InfoCard>
            ))}
          </div>
        )}
      </FormSection>

      {/* Trend Analysis */}
      <FormSection title="Trend Analysis">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Flow Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Flow Trend</CardTitle>
                {getTrendBadge(trends.flowTrend.actualDirection)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                {getTrendIcon(trends.flowTrend.actualDirection)}
                <div className="flex-1">
                  <p className="text-sm">
                    PA should <strong>decrease</strong> as flow increases
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {trends.flowTrend.actualDirection}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {trends.flowTrend.details.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                  >
                    <span className="text-muted-foreground">
                      @ {detail.fixedValue} mm/s²
                    </span>
                    <div className="flex items-center gap-2">
                      {detail.isDecreasing ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono">
                        {detail.slope > 0 ? '+' : ''}{detail.slope.toFixed(5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Accel Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Acceleration Trend</CardTitle>
                {getTrendBadge(trends.accelTrend.actualDirection)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                {getTrendIcon(trends.accelTrend.actualDirection)}
                <div className="flex-1">
                  <p className="text-sm">
                    PA should <strong>decrease</strong> as acceleration increases
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {trends.accelTrend.actualDirection}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                {trends.accelTrend.details.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-xs p-2 rounded bg-muted/30"
                  >
                    <span className="text-muted-foreground">
                      @ {detail.fixedValue.toFixed(2)} mm³/s
                    </span>
                    <div className="flex items-center gap-2">
                      {detail.isDecreasing ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      )}
                      <span className="font-mono">
                        {detail.slope > 0 ? '+' : ''}{detail.slope.toFixed(5)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </FormSection>

      {/* Statistical Analysis */}
      <FormSection title="Statistical Summary">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Mean PA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-mono font-bold">
                {statistics.mean.toFixed(4)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Std Dev</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-mono font-bold">
                {statistics.stdDev.toFixed(4)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">CV</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-mono font-bold">
                {statistics.coefficientOfVariation.toFixed(1)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono">
                {statistics.range[0].toFixed(3)} - {statistics.range[1].toFixed(3)}
              </div>
            </CardContent>
          </Card>
        </div>
      </FormSection>

      {/* Outlier Detection */}
      {outlierTiles.length > 0 && (
        <FormSection title="Outlier Detection">
          <InfoCard variant="warning">
            <strong>{outlierTiles.length} outlier(s)</strong> detected using {outlierTiles[0].method.toUpperCase()} method
          </InfoCard>

          <div className="space-y-2">
            {outlierTiles.map((outlier) => (
              <div
                key={outlier.tileId}
                className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5"
              >
                <div>
                  <span className="font-semibold">Tile {outlier.tileId}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    PA: {outlier.paValue.toFixed(4)}
                  </span>
                </div>
                <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                  {outlier.deviation.toFixed(2)}σ deviation
                </Badge>
              </div>
            ))}
          </div>
        </FormSection>
      )}
    </div>
  );
};
