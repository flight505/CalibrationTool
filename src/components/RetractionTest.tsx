import { RotateCcw, AlertCircle } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const RetractionTest = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <RotateCcw className="w-8 h-8" />
            Retraction Test Manager
          </CardTitle>
          <CardDescription className="text-base">
            Optimize retraction settings to eliminate stringing
          </CardDescription>
        </CardHeader>
      </Card>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Coming Soon</AlertTitle>
        <AlertDescription>
          The Retraction Test tool is currently under development. This tool will help you:
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Test different retraction distances and speeds</li>
            <li>Analyze stringing and oozing patterns</li>
            <li>Find optimal settings for your filament</li>
            <li>Generate retraction tower models</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default RetractionTest;