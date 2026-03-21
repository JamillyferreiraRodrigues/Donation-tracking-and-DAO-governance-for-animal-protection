// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiConfig } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import 'semantic-ui-css/semantic.min.css' 
import { wagmiConfig } from './wagmi'

// Criar cliente do React Query
const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiConfig>
  </StrictMode>,
)
