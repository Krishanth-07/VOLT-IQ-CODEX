import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { EnergyProvider } from './context/EnergyContext'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <EnergyProvider>
        <App />
      </EnergyProvider>
    </BrowserRouter>
  </StrictMode>,
)
