import { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import Layout from '@/components/Layout'
import FirstLayerCalibrationV2 from '@/components/FirstLayerCalibrationV2'
import FlowRateCalibrationV2 from '@/components/FlowRateCalibrationV2'
import FlowRateTowerV2 from '@/components/FlowRateTowerV2'
import FanSpeedTowerV2 from '@/components/FanSpeedTowerV2'
import TemperatureTower from '@/components/TemperatureTower'
import PressureAdvanceV2 from '@/components/PressureAdvanceV2'
import RetractionTestV2 from '@/components/RetractionTestV2'
import MaxVolumetricSpeedV2 from '@/components/MaxVolumetricSpeedV2'
import Welcome from '@/components/Welcome'
import { DocumentationLayout } from '@/components/DocumentationLayout'
import Recommendations from '@/components/Recommendations'
import ChatPage from '@/components/ChatPage'
import DOEWorkbench from '@/components/DOEWorkbench'

function App() {
  const [currentTool, setCurrentTool] = useState('welcome')
  const [docPath, setDocPath] = useState<string | undefined>()

  const handleToolChange = (tool: string, path?: string) => {
    setCurrentTool(tool)
    setDocPath(path)
  }

  const renderTool = () => {
    switch (currentTool) {
      case 'welcome':
        return <Welcome onNavigateToTool={handleToolChange} />
      case 'firstlayer':
        return <FirstLayerCalibrationV2 onNavigate={handleToolChange} />
      case 'flow':
        return <FlowRateCalibrationV2 onNavigate={handleToolChange} />
      case 'flowtower':
        return <FlowRateTowerV2 onNavigate={handleToolChange} />
      case 'fanspeed':
        return <FanSpeedTowerV2 onNavigate={handleToolChange} />
      case 'temperature':
        return <TemperatureTower onNavigate={handleToolChange} />
      case 'pressure':
        return <PressureAdvanceV2 onNavigate={handleToolChange} />
      case 'retraction':
        return <RetractionTestV2 onNavigate={handleToolChange} />
      case 'maxspeed':
        return <MaxVolumetricSpeedV2 onNavigate={handleToolChange} />
      case 'recommendations':
        return <Recommendations onNavigate={handleToolChange} />
      case 'doe':
        return <DOEWorkbench />
      case 'doe-templates':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Experiment Templates</h2>
            <p className="text-muted-foreground">
              Pre-configured DOE templates for common calibration scenarios.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">PLA Basic Calibration</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  L9 array for temperature, flow, and retraction
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">PETG Optimization</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  L18 array for comprehensive PETG tuning
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold">Speed Optimization</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Focus on speed, acceleration, and jerk settings
                </p>
              </div>
            </div>
          </div>
        )
      case 'doe-analysis':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Results Analysis</h2>
            <p className="text-muted-foreground">
              Analyze your DOE experiment results with statistical tools.
            </p>
            <div className="border rounded-lg p-6 bg-muted/30">
              <p className="text-center text-muted-foreground">
                No experiments available for analysis. Complete a DOE experiment first.
              </p>
            </div>
          </div>
        )
      case 'documentation':
        return <DocumentationLayout onBack={() => handleToolChange('guide')} initialPath={docPath} />
      case 'chat':
        return <ChatPage />
      default:
        return <Welcome onNavigateToTool={handleToolChange} />
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="orca-calibration-theme">
      <Layout currentTool={currentTool} onToolChange={handleToolChange}>
        {renderTool()}
      </Layout>
    </ThemeProvider>
  )
}

export default App
