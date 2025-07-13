import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Info, FileText, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface CalibrationStep {
  id: string;
  title: string;
  description: string;
  tool: string;
  time: string;
  tips: string[];
}

const calibrationSteps: CalibrationStep[] = [
  {
    id: 'temperature',
    title: 'Temperature Calibration',
    description: 'Find the optimal printing temperature for your filament',
    tool: 'temperature',
    time: '30 min',
    tips: [
      'Start 10°C above typical temperature',
      'Look for best layer adhesion with minimal stringing',
      'Check overhang quality at each temperature',
      'Choose lower temp if two look similar'
    ]
  },
  {
    id: 'flow',
    title: 'Flow Rate Calibration',
    description: 'Calibrate extrusion multiplier for dimensional accuracy',
    tool: 'flow',
    time: '20-40 min',
    tips: [
      'Use cube method for highest accuracy',
      'YOLO mode for quick fine-tuning',
      'Measure walls with calipers at multiple points',
      'Average all measurements for best results'
    ]
  },
  {
    id: 'pressure',
    title: 'Pressure Advance',
    description: 'Tune pressure advance for sharp corners',
    tool: 'pressure',
    time: '20 min',
    tips: [
      'Look at corners, not straight sections',
      'Find sharpest corners without gaps',
      'Material-specific values needed',
      'Bowden needs 10x higher values than direct drive'
    ]
  },
  {
    id: 'retraction',
    title: 'Retraction Tuning',
    description: 'Eliminate stringing with optimal retraction',
    tool: 'retraction',
    time: '15 min',
    tips: [
      'Find minimum retraction that stops stringing',
      'More is not better - can cause clogs',
      'PETG/TPU are naturally stringy',
      'Consider Z-hop for complex prints'
    ]
  },
  {
    id: 'maxspeed',
    title: 'Max Volumetric Speed',
    description: 'Find your hotend\'s melting limit',
    tool: 'maxspeed',
    time: '25 min',
    tips: [
      'Look for rough surface or thin layers',
      'Listen for extruder clicking',
      'Use 80-90% of max for safety',
      'Temperature dependent - test at print temp'
    ]
  }
];

interface CalibrationGuideProps {
  onNavigateToTool: (tool: string) => void;
}

const CalibrationGuide: React.FC<CalibrationGuideProps> = ({ onNavigateToTool }) => {
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState(0);

  const toggleStepCompletion = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const progress = (completedSteps.size / calibrationSteps.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center gap-3">
            <FileText className="w-8 h-8" />
            Calibration Guide
          </CardTitle>
          <CardDescription className="text-base">
            Follow the recommended sequence for best results
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {completedSteps.size} of {calibrationSteps.length} calibrations completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Why This Order?</AlertTitle>
        <AlertDescription>
          Each calibration builds on the previous. Temperature affects all other settings, 
          flow rate affects pressure advance, and so on. Following this sequence ensures 
          each calibration is based on accurate foundations.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {calibrationSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStep;
          
          return (
            <Card 
              key={step.id} 
              className={`transition-all ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleStepCompletion(step.id)}
                      className="mt-1"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <CardTitle className="text-lg">
                        {index + 1}. {step.title}
                      </CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        Estimated time: {step.time}
                      </p>
                    </div>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setCurrentStep(index);
                      onNavigateToTool(step.tool);
                    }}
                  >
                    Go to Tool
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  <AccordionItem value="tips" className="border-none">
                    <AccordionTrigger className="text-sm py-2">
                      View Tips
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {step.tips.map((tip, tipIndex) => (
                          <li key={tipIndex}>• {tip}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            After Calibration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold mb-1">Save Your Profile</h4>
            <p className="text-muted-foreground">
              Click the save icon in Orca Slicer to save your calibrated filament profile. 
              Name it: [Brand]-[Material]-[Color]
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Test Print</h4>
            <p className="text-muted-foreground">
              Print a test model like Benchy or a calibration cube to verify all settings 
              work together correctly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Document Settings</h4>
            <p className="text-muted-foreground">
              Keep notes about ambient temperature, humidity, and any special considerations 
              for future reference.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationGuide;