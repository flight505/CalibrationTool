import { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import Layout from '@/components/Layout'
import FlowRateCalibration from '@/components/FlowRateCalibration'
import TemperatureTower from '@/components/TemperatureTower'
import PressureAdvance from '@/components/PressureAdvance'
import RetractionTest from '@/components/RetractionTest'
import MaxVolumetricSpeed from '@/components/MaxVolumetricSpeed'
import CalibrationGuide from '@/components/CalibrationGuide'

function App() {
  const [currentTool, setCurrentTool] = useState('guide')

  const renderTool = () => {
    switch (currentTool) {
      case 'guide':
        return <CalibrationGuide onNavigateToTool={setCurrentTool} />
      case 'flow':
        return <FlowRateCalibration />
      case 'temperature':
        return <TemperatureTower />
      case 'pressure':
        return <PressureAdvance />
      case 'retraction':
        return <RetractionTest />
      case 'maxspeed':
        return <MaxVolumetricSpeed />
      default:
        return <CalibrationGuide onNavigateToTool={setCurrentTool} />
    }
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="orca-calibration-theme">
      <Layout currentTool={currentTool} onToolChange={setCurrentTool}>
        {renderTool()}
      </Layout>
    </ThemeProvider>
  )
}

export default App