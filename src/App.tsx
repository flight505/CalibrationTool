import { useState } from 'react'
import { ThemeProvider } from '@/components/providers/theme-provider'
import Layout from '@/components/Layout'
import FlowRateCalibration from '@/components/FlowRateCalibration'
import TemperatureTower from '@/components/TemperatureTower'
import PressureAdvance from '@/components/PressureAdvance'
import RetractionTest from '@/components/RetractionTest'
import MaxVolumetricSpeed from '@/components/MaxVolumetricSpeed'

function App() {
  const [currentTool, setCurrentTool] = useState('flow')

  const renderTool = () => {
    switch (currentTool) {
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
        return <FlowRateCalibration />
    }
  }

  return (
    <ThemeProvider defaultTheme="system" storageKey="orca-calibration-theme">
      <Layout currentTool={currentTool} onToolChange={setCurrentTool}>
        {renderTool()}
      </Layout>
    </ThemeProvider>
  )
}

export default App