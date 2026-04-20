import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { EnergyAgePage } from './pages/EnergyAgePage'
import { RenewableOptimiserPage } from './pages/RenewableOptimiserPage'
import { SolarAdvisorPage } from './pages/SolarAdvisorPage'
import { WhatIfChatbotPage } from './pages/WhatIfChatbotPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/renewable" element={<RenewableOptimiserPage />} />
        <Route path="/solar" element={<SolarAdvisorPage />} />
        <Route path="/energy-age" element={<EnergyAgePage />} />
        <Route path="/what-if" element={<WhatIfChatbotPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
