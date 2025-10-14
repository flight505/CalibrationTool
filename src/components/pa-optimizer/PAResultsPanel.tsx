import { useState, useMemo } from 'react';
import { Copy, Check, FileDown, Settings2 } from 'lucide-react';
import { FormSection, InfoCard } from '@/components/calibration/CalibrationToolLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PAAnalysisResult } from '@/lib/pa-optimizer';
import { formatForOrcaSlicer, exportAsCSV, generateExtendedTable } from '@/lib/pa-optimizer';

interface PAResultsPanelProps {
  analysis: PAAnalysisResult;
}

export const PAResultsPanel: React.FC<PAResultsPanelProps> = ({ analysis }) => {
  const [copiedOptimized, setCopiedOptimized] = useState(false);
  const [copiedExtended, setCopiedExtended] = useState(false);
  const [showSpeedCustomizer, setShowSpeedCustomizer] = useState(false);
  const [customSpeeds, setCustomSpeeds] = useState('40, 60, 80, 100, 120, 150, 200, 250, 300');
  const [customAccels, setCustomAccels] = useState('3000, 4000, 6000, 8000, 10000, 12000');

  // Parse custom speeds/accels and regenerate extended table
  const extendedTable = useMemo(() => {
    if (!showSpeedCustomizer) {
      return analysis.extendedTable;
    }

    try {
      const speeds = customSpeeds
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => a - b);

      const accels = customAccels
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => a - b);

      if (speeds.length === 0 || accels.length === 0) {
        return analysis.extendedTable;
      }

      return generateExtendedTable(analysis.testData, analysis.selectedModel, {
        targetSpeeds: speeds,
        targetAccels: accels,
        extrapolationLimit: 50,
        minPA: 0.001,
        maxPA: 1.0,
      });
    } catch (error) {
      console.error('Error generating custom extended table:', error);
      return analysis.extendedTable;
    }
  }, [showSpeedCustomizer, customSpeeds, customAccels, analysis]);

  const optimizedOutput = formatForOrcaSlicer(analysis.optimizedTable);
  const extendedOutput = formatForOrcaSlicer(extendedTable);

  const handleCopy = async (text: string, type: 'optimized' | 'extended') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'optimized') {
        setCopiedOptimized(true);
        setTimeout(() => setCopiedOptimized(false), 2000);
      } else {
        setCopiedExtended(true);
        setTimeout(() => setCopiedExtended(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadCSV = (type: 'optimized' | 'extended') => {
    const table = type === 'optimized' ? analysis.optimizedTable : extendedTable;
    const csv = exportAsCSV(table);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pa_${type}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getConfidenceBadge = (confidence: string) => {
    if (confidence === 'high') return <Badge className="bg-green-500">High</Badge>;
    if (confidence === 'medium') return <Badge variant="secondary">Medium</Badge>;
    return <Badge variant="outline">Low</Badge>;
  };

  return (
    <div className="space-y-6">
      <FormSection title="PA Tables">
        <Tabs defaultValue="optimized" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="optimized">Optimized (Original Points)</TabsTrigger>
            <TabsTrigger value="extended">Extended (Extrapolated)</TabsTrigger>
          </TabsList>

          {/* Optimized Table */}
          <TabsContent value="optimized" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Optimized PA Table</CardTitle>
                    <CardDescription className="mt-2">
                      {analysis.optimizedTable.entries.length} entries using {analysis.optimizedTable.modelUsed.replace('_', ' ')} model
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(optimizedOutput, 'optimized')}
                      className="gap-2"
                    >
                      {copiedOptimized ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedOptimized ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCSV('optimized')}
                      className="gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-muted">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-2 font-medium">Speed (mm/s)</th>
                        <th className="px-4 py-2 font-medium">Flow (mm³/s)</th>
                        <th className="px-4 py-2 font-medium">Accel (mm/s²)</th>
                        <th className="px-4 py-2 font-medium">PA Value</th>
                        <th className="px-4 py-2 font-medium">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.optimizedTable.entries.map((entry, i) => (
                        <tr key={i} className="border-t border-muted/60">
                          <td className="px-4 py-2">{entry.speed}</td>
                          <td className="px-4 py-2 font-mono">{entry.flow.toFixed(2)}</td>
                          <td className="px-4 py-2">{entry.accel}</td>
                          <td className="px-4 py-2 font-mono font-semibold">{entry.paValue.toFixed(6)}</td>
                          <td className="px-4 py-2">{getConfidenceBadge(entry.confidence)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">OrcaSlicer Format (PA, Flow, Accel)</p>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-mono text-foreground bg-background p-3 rounded-md border border-primary/30 max-h-64 overflow-y-auto">
                    {optimizedOutput}
                  </pre>
                </div>

                <InfoCard variant="tip">
                  <strong>How to use:</strong> Copy the table above and paste into OrcaSlicer → Filament Settings → Advanced → Adaptive pressure advance measurements
                </InfoCard>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Extended Table */}
          <TabsContent value="extended" className="space-y-4">
            {/* Speed/Accel Customizer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Speed & Acceleration Range</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSpeedCustomizer(!showSpeedCustomizer)}
                    className="gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    {showSpeedCustomizer ? 'Hide' : 'Customize'}
                  </Button>
                </div>
              </CardHeader>
              {showSpeedCustomizer && (
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="customSpeeds">Print Speeds (mm/s)</Label>
                      <Input
                        id="customSpeeds"
                        value={customSpeeds}
                        onChange={(e) => setCustomSpeeds(e.target.value)}
                        placeholder="40, 60, 80, 100, 120, 150, 200, 250, 300"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated list of speeds
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customAccels">Accelerations (mm/s²)</Label>
                      <Input
                        id="customAccels"
                        value={customAccels}
                        onChange={(e) => setCustomAccels(e.target.value)}
                        placeholder="3000, 4000, 6000, 8000, 10000, 12000"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Comma-separated list of accelerations
                      </p>
                    </div>
                  </div>
                  <InfoCard variant="warning">
                    <strong>Extrapolation Warning:</strong> Values outside your calibrated range (Flow: {analysis.extendedTable.calibratedRange.flowRange[0].toFixed(2)}-{analysis.extendedTable.calibratedRange.flowRange[1].toFixed(2)} mm³/s, Accel: {analysis.extendedTable.calibratedRange.accelRange[0]}-{analysis.extendedTable.calibratedRange.accelRange[1]} mm/s²) will be extrapolated with lower confidence.
                  </InfoCard>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Extended PA Table</CardTitle>
                    <CardDescription className="mt-2">
                      {extendedTable.entries.length} entries with extrapolation to practical printing speeds
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(extendedOutput, 'extended')}
                      className="gap-2"
                    >
                      {copiedExtended ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedExtended ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadCSV('extended')}
                      className="gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      CSV
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-muted">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="text-left">
                        <th className="px-4 py-2 font-medium">Speed (mm/s)</th>
                        <th className="px-4 py-2 font-medium">Flow (mm³/s)</th>
                        <th className="px-4 py-2 font-medium">Accel (mm/s²)</th>
                        <th className="px-4 py-2 font-medium">PA Value</th>
                        <th className="px-4 py-2 font-medium">Confidence</th>
                        <th className="px-4 py-2 font-medium">Extrapolated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {extendedTable.entries.map((entry, i) => (
                        <tr
                          key={i}
                          className={`border-t border-muted/60 ${
                            entry.isExtrapolated ? 'bg-yellow-500/5' : ''
                          }`}
                        >
                          <td className="px-4 py-2">{entry.speed}</td>
                          <td className="px-4 py-2 font-mono">{entry.flow.toFixed(2)}</td>
                          <td className="px-4 py-2">{entry.accel}</td>
                          <td className="px-4 py-2 font-mono font-semibold">{entry.paValue.toFixed(6)}</td>
                          <td className="px-4 py-2">{getConfidenceBadge(entry.confidence)}</td>
                          <td className="px-4 py-2">
                            {entry.isExtrapolated ? (
                              <Badge variant="outline" className="text-xs">
                                {entry.extrapolationAmount!.toFixed(0)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">OrcaSlicer Format (PA, Flow, Accel)</p>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs font-mono text-foreground bg-background p-3 rounded-md border border-primary/30 max-h-64 overflow-y-auto">
                    {extendedOutput}
                  </pre>
                </div>

                <InfoCard variant="warning">
                  <strong>Note on extrapolation:</strong> Entries marked as "extrapolated" are predictions beyond your calibrated range.
                  Use with caution for critical prints. The confidence level indicates prediction reliability.
                </InfoCard>

                <InfoCard variant="info">
                  <strong>Calibrated range:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Flow: {extendedTable.calibratedRange.flowRange[0].toFixed(2)} - {extendedTable.calibratedRange.flowRange[1].toFixed(2)} mm³/s</li>
                    <li>• Acceleration: {extendedTable.calibratedRange.accelRange[0]} - {extendedTable.calibratedRange.accelRange[1]} mm/s²</li>
                  </ul>
                </InfoCard>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </FormSection>
    </div>
  );
};
