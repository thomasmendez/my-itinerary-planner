import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'theme'

function initialTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  return { theme, toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) }
}
