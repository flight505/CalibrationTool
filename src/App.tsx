import { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import Layout from '@/components/Layout'
import FlowRateCalibration from '@/components/FlowRateCalibration'
import TemperatureTower from '@/components/TemperatureTower'
import PressureAdvance from '@/components/PressureAdvance'
import RetractionTest from '@/components/RetractionTest'
import MaxVolumetricSpeed from '@/components/MaxVolumetricSpeed'
import CalibrationGuide from '@/components/CalibrationGuide'
import { DocumentationLayout } from '@/components/DocumentationLayout'

function App() {
  const [currentTool, setCurrentTool] = useState('guide')
  const [docPath, setDocPath] = useState<string | undefined>()

  const handleToolChange = (tool: string, path?: string) => {
    setCurrentTool(tool)
    setDocPath(path)
  }

  const renderTool = () => {
    switch (currentTool) {
      case 'guide':
        return <CalibrationGuide onNavigateToTool={handleToolChange} />
      case 'flow':
        return <FlowRateCalibration onNavigate={handleToolChange} />
      case 'temperature':
        return <TemperatureTower onNavigate={handleToolChange} />
      case 'pressure':
        return <PressureAdvance onNavigate={handleToolChange} />
      case 'retraction':
        return <RetractionTest onNavigate={handleToolChange} />
      case 'maxspeed':
        return <MaxVolumetricSpeed onNavigate={handleToolChange} />
      case 'documentation':
        return <DocumentationLayout onBack={() => handleToolChange('guide')} initialPath={docPath} />
      default:
        return <CalibrationGuide onNavigateToTool={setCurrentTool} />
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