import { Move3D, AlertCircle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const PressureAdvance = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Move3D className="w-8 h-8" />
            Pressure Advance Calibration
          </CardTitle>
          <CardDescription className="text-base">
            Tune pressure advance for sharper corners and better print quality
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Pressure Advance calibration tool is currently under development. This tool will help you:
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Generate pressure advance test patterns</li>
            <li>Calculate optimal PA values</li>
            <li>Compare results across different speeds</li>
            <li>Export settings for Orca Slicer profiles</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PressureAdvance;