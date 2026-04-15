import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import './index.css'
import App from './App.tsx'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

async function initApp() {
  // Fetch Azure credentials from backend (no auth needed)
  let clientId = ''
  let tenantId = ''
  let azureVerified = false

  try {
    const res = await fetch(`${BACKEND_URL}/api/settings/public`)
    const json = await res.json()
    clientId = json?.data?.azure_client_id || ''
    tenantId = json?.data?.azure_tenant_id || ''
    azureVerified = json?.data?.azure_verified === true
  } catch {
    // Backend not reachable — fall back to dev mode
  }

  // Only initialize MSAL with real credentials if azure_verified is true
  const useRealMsal = azureVerified && !!clientId && !!tenantId

  // Build MSAL config dynamically from DB values
  const msalConfig = {
    auth: {
      clientId: useRealMsal ? clientId : 'dev-mode',
      authority: `https://login.microsoftonline.com/${useRealMsal ? tenantId : 'common'}`,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
    },
    cache: {
      cacheLocation: 'localStorage' as const,
      storeAuthStateInCookie: false,
    },
  }

  const msalInstance = new PublicClientApplication(msalConfig)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </StrictMode>,
  )
}

initApp()
