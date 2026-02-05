import { ScriptOnce } from '@tanstack/react-router'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'dark' | 'light'
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'dark',
})

const STORAGE_KEY = 'qmd-theme'

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const themeScript = `
(function() {
  try {
    const theme = localStorage.getItem('${STORAGE_KEY}') || 'system'
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const resolved = theme === 'system' ? systemTheme : theme
    document.documentElement.classList.add(resolved)
  } catch (e) {}
})()
`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
      const initialTheme = stored || 'system'
      const resolved =
        initialTheme === 'system' ? getSystemTheme() : initialTheme
      setThemeState(initialTheme)
      setResolvedTheme(resolved)
    } catch (e) {
      console.warn('Failed to initialize theme:', e)
    }
  }, [])

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme
    setResolvedTheme(resolved)

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)

    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch (e) {
      console.log('localStorage not available')
    }
  }, [theme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newResolved = mediaQuery.matches ? 'dark' : 'light'
      setResolvedTheme(newResolved)
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(newResolved)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
  }

  return (
    <>
      <ScriptOnce>{themeScript}</ScriptOnce>
      <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
        {children}
      </ThemeContext.Provider>
    </>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
