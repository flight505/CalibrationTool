import { Thermometer, AlertCircle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TemperatureTower = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <Thermometer className="w-8 h-8" />
            Temperature Tower Analysis
          </CardTitle>
          <CardDescription className="text-base">
            Find the optimal printing temperature for your filament
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Temperature Tower analysis tool is currently under development. This tool will help you:
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Generate custom temperature tower G-code</li>
            <li>Analyze print quality at different temperatures</li>
            <li>Determine optimal temperature ranges</li>
            <li>Save temperature profiles for different filaments</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TemperatureTower;