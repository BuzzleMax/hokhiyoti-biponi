/* eslint-disable react-refresh/only-export-components */
import { type ReactNode, createContext, useEffect, useMemo, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'hokhiyoti_theme_mode'

function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved

  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
  return prefersDark ? 'dark' : 'light'
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => getInitialMode())

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  const toggle = () => setMode(mode === 'dark' ? 'light' : 'dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }, [mode])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, toggle }), [mode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

