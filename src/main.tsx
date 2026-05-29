import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'
import { msalConfig } from './auth/msalConfig'
import { AuthProvider } from './auth/AuthContext'

const msalInstance = new PublicClientApplication(msalConfig)

void msalInstance.initialize().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MsalProvider>
    </StrictMode>,
  )
})
