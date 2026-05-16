import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './core/i18n'
import App from './App.tsx'
import { ThemeProvider } from './core/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
