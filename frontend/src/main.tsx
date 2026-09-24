// Provenance: 79257eac-aa27-4700-8fc7-9c70fbb93736
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { store } from './store/store'

async function prepare() {
  // VITE_DEMO=true lets a production build (e.g. hosted on S3, no backend) start MSW too —
  // baked in at build time since there's no server to read env vars from at runtime.
  const shouldMock = (import.meta.env.DEV && import.meta.env.VITE_MOCKING !== 'false') || import.meta.env.VITE_DEMO === 'true'
  if (shouldMock) {
    console.warn('[my-itinerary-planner] MSW mocking is ON - API calls are intercepted with fixture data, not hitting the real backend.')
    const { activeHandlers, worker } = await import('./mocks/browser')
    if (import.meta.env.VITE_DEMO === 'true') {
      // Patch fetch/XHR in-page instead of using a service worker: DevTools' "Bypass for network"
      // or a hard reload skips the worker, and /api/* then falls through to the static host
      const { setupServer } = await import('msw/native')
      setupServer(...activeHandlers).listen({ onUnhandledRequest: 'bypass' })
    } else {
      await worker.start({ onUnhandledRequest: 'bypass' })
    }
  } else if (import.meta.env.DEV) {
    console.info('[my-itinerary-planner] dev mode, MSW mocking is OFF - API calls go through the Vite proxy to the real backend.')
  }
}

prepare().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    </StrictMode>,
  )
})
