import { useContext } from 'react'
import { Moon, Sun } from 'lucide-react'
import { ThemeContext } from './ThemeProvider'

export default function ThemeToggle() {
  const ctx = useContext(ThemeContext)
  if (!ctx) return null

  const { mode, toggle } = ctx

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)]/70 bg-[var(--color-surface)] hover:bg-[rgba(229,228,231,0.55)] dark:hover:bg-[rgba(46,48,58,0.55)] transition-[background-color]"
      aria-label={mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {mode === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}

