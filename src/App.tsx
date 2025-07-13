import { useState } from 'react'
import Layout from '@/components/Layout'
import OrcaFlowCalibration from '@/components/OrcaFlowCalibration'
import TemperatureTower from '@/components/TemperatureTower'
import PressureAdvance from '@/components/PressureAdvance'
import RetractionTest from '@/components/RetractionTest'

function App() {
  const [currentTool, setCurrentTool] = useState('flow')

  const renderTool = () => {
    switch (currentTool) {
      case 'flow':
        return <OrcaFlowCalibration />
      case 'temperature':
        return <TemperatureTower />
      case 'pressure':
        return <PressureAdvance />
      case 'retraction':
        return <RetractionTest />
      default:
        return <OrcaFlowCalibration />
    }
  }

  return (
    <Layout currentTool={currentTool} onToolChange={setCurrentTool}>
      {renderTool()}
    </Layout>
  )
}

export default App