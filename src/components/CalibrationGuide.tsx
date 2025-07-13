import { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Info, FileText, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calibrationSteps.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const isCurrent = index === currentStep;
          
          return (
            <Card 
              key={step.id} 
              className={`transition-all hover:shadow-lg cursor-pointer ${isCurrent ? 'ring-2 ring-primary' : ''} ${isCompleted ? 'bg-muted/30' : ''}`}
              onClick={() => {
                setCurrentStep(index);
                onNavigateToTool(step.tool);
              }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-muted-foreground">{index + 1}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStepCompletion(step.id);
                        }}
                        className="ml-auto"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription className="text-sm mt-1">{step.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>⏱ {step.time}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tips" className="border-none">
                    <AccordionTrigger 
                      className="text-xs py-1 hover:no-underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Quick Tips
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1 text-xs text-muted-foreground mt-2">
                        {step.tips.slice(0, 2).map((tip, tipIndex) => (
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