import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { FormSection, InfoCard } from '@/components/calibration/CalibrationToolLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PAAnalysisResult, ModelType } from '@/lib/pa-optimizer';

interface PAModelingPanelProps {
  analysis: PAAnalysisResult;
  selectedModelType: ModelType;
  onModelSelect: (modelType: string | null) => void;
}

export const PAModelingPanel: React.FC<PAModelingPanelProps> = ({
  analysis,
  selectedModelType,
  onModelSelect
}) => {
  const { modelComparison, selectedModel } = analysis;
  const isAutoSelected = selectedModelType === modelComparison.autoSelectedModel;

  const getModelBadge = (r2: number) => {
    if (r2 > 0.95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (r2 > 0.90) return <Badge className="bg-blue-500">Good</Badge>;
    if (r2 > 0.85) return <Badge variant="secondary">Acceptable</Badge>;
    return <Badge variant="outline">Poor</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Auto-Selected Model */}
      <FormSection title="Selected Model">
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  {modelComparison.models.find(m => m.selected)?.name}
                </CardTitle>
                <CardDescription className="mt-2">
                  {modelComparison.reason}
                </CardDescription>
              </div>
              {getModelBadge(selectedModel.r2)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">R² (Coefficient of Determination)</p>
                <p className="text-2xl font-mono font-bold">{selectedModel.r2.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RMSE (Root Mean Square Error)</p>
                <p className="text-2xl font-mono font-bold">{selectedModel.rmse.toFixed(6)}</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-sm font-medium mb-2">Model Coefficients</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                {Object.entries(selectedModel.coefficients).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{key}:</span>
                    <span className="font-semibold">{(value as number).toFixed(6)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedModel.modelType === 'exponential_decay' && (
              <InfoCard variant="info">
                <strong>Exponential Decay Formula:</strong> PA = a × exp(-b×flow) × exp(-c×accel)
                <br />
                <span className="text-xs text-muted-foreground">
                  This physics-based model naturally enforces decreasing trends with flow and acceleration.
                </span>
              </InfoCard>
            )}

            {selectedModel.modelType === 'polynomial' && (
              <InfoCard variant="info">
                <strong>Polynomial Formula:</strong> PA = a + b×flow + c×accel + d×flow² + e×accel²
                <br />
                <span className="text-xs text-muted-foreground">
                  Flexible 2nd-order polynomial allowing non-linear relationships.
                </span>
              </InfoCard>
            )}

            {selectedModel.modelType === 'power_law' && (
              <InfoCard variant="info">
                <strong>Power Law Formula:</strong> PA = a × flow^b × accel^c
                <br />
                <span className="text-xs text-muted-foreground">
                  Alternative physics model with power relationships.
                </span>
              </InfoCard>
            )}

            {selectedModel.modelType === 'robust_polynomial' && (
              <InfoCard variant="success">
                <strong>Robust Polynomial (RANSAC):</strong> Outlier-resistant polynomial fitting
                <br />
                <span className="text-xs text-muted-foreground">
                  Uses RANSAC algorithm to minimize impact of outliers on the fit.
                </span>
              </InfoCard>
            )}
          </CardContent>
        </Card>
      </FormSection>

      {/* Model Comparison */}
      <FormSection
        title="Model Comparison"
        action={
          !isAutoSelected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onModelSelect(null)}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Auto
            </Button>
          )
        }
      >
        {!isAutoSelected && (
          <InfoCard variant="info">
            You've manually selected a model. The auto-selection recommended{' '}
            <strong>{modelComparison.models.find(m => m.type === modelComparison.autoSelectedModel)?.name}</strong>.
            Click "Reset to Auto" to revert.
          </InfoCard>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {modelComparison.models.map((model) => {
            const isCurrentlySelected = model.type === selectedModelType;
            return (
              <Card
                key={model.type}
                className={`cursor-pointer transition-all ${
                  isCurrentlySelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-muted hover:border-primary/50'
                }`}
                onClick={() => onModelSelect(model.type)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      {isCurrentlySelected && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      {model.name}
                      {model.type === modelComparison.autoSelectedModel && !isCurrentlySelected && (
                        <Badge variant="outline" className="text-xs ml-2">Auto</Badge>
                      )}
                    </CardTitle>
                    {getModelBadge(model.r2)}
                  </div>
                </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">R²</p>
                    <p className="font-mono font-bold">{model.r2.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">RMSE</p>
                    <p className="font-mono font-bold">{model.rmse.toFixed(6)}</p>
                  </div>
                </div>

                {model.warnings.length > 0 && (
                  <div className="space-y-1">
                    {model.warnings.map((warning, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-yellow-600">
                        <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            );
          })}
        </div>

        <InfoCard variant="tip">
          <strong>Model Selection Logic:</strong>
          <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
            <li>2+ outliers → Robust Polynomial (RANSAC)</li>
            <li>Inverted trends → Exponential Decay (enforce physics)</li>
            <li>High variability (CV &gt; 25%) → Robust Polynomial</li>
            <li>Otherwise → Highest R² score</li>
          </ul>
        </InfoCard>
      </FormSection>

      {/* Residual Analysis */}
      <FormSection title="Residual Analysis">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Prediction Accuracy</CardTitle>
            <CardDescription>
              Residuals show the difference between measured and predicted PA values
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
            {analysis.testData.map((test) => {
                const predicted = selectedModel.predict(test.flow, test.accel);
                const residual = test.paValue - predicted;
                const absResidual = Math.abs(residual);
                const isLarge = absResidual > selectedModel.rmse * 1.5;

                return (
                  <div
                    key={test.tileId}
                    className={`flex items-center justify-between p-2 rounded text-xs ${
                      isLarge ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-muted/30'
                    }`}
                  >
                    <span className="font-medium">Tile {test.tileId}</span>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-muted-foreground">
                        Measured: {test.paValue.toFixed(4)}
                      </span>
                      <span className="text-muted-foreground">
                        Predicted: {predicted.toFixed(4)}
                      </span>
                      <span className={residual > 0 ? 'text-red-500' : 'text-green-500'}>
                        Residual: {residual > 0 ? '+' : ''}{residual.toFixed(4)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/30">
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className="text-muted-foreground">Mean Residual</p>
                  <p className="font-mono font-bold">
                    {(() => {
                      const allResiduals = analysis.testData.map(test =>
                        test.paValue - selectedModel.predict(test.flow, test.accel)
                      );
                      const mean = allResiduals.reduce((sum, r) => sum + r, 0) / allResiduals.length;
                      return mean.toFixed(6);
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Max Residual</p>
                  <p className="font-mono font-bold">
                    {(() => {
                      const allResiduals = analysis.testData.map(test =>
                        test.paValue - selectedModel.predict(test.flow, test.accel)
                      );
                      const max = Math.max(...allResiduals.map(r => Math.abs(r)));
                      return max.toFixed(6);
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">RMSE</p>
                  <p className="font-mono font-bold">
                    {selectedModel.rmse.toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </FormSection>
    </div>
  );
};
