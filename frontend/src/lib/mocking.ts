// True whenever MSW is intercepting API calls, dev or a VITE_DEMO prod build (see src/main.tsx).
export const isMocking =
  (import.meta.env.DEV && import.meta.env.VITE_MOCKING !== 'false') || import.meta.env.VITE_DEMO === 'true'
