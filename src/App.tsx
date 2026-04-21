import { Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { AdvisorPage } from './pages/AdvisorPage'
import { DashboardPage } from './pages/DashboardPage'
import { EnergyAgePage } from './pages/EnergyAgePage'
import { SolarAdvisorPage } from './pages/SolarAdvisorPage'
import { WhatIfChatbotPage } from './pages/WhatIfChatbotPage'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/advisor" element={<AdvisorPage />} />
        <Route path="/solar" element={<SolarAdvisorPage />} />
        <Route path="/energy-age" element={<EnergyAgePage />} />
        <Route path="/what-if" element={<WhatIfChatbotPage />} />
      </Routes>
    </AppShell>
  )
}

export default App
