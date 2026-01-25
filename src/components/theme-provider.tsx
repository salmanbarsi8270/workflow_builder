import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
  accentStorageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  accentColor: string
  setAccentColor: (color: string) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
  accentColor: "#3b82f6", // Default blue-500
  setAccentColor: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  accentStorageKey = "vite-ui-accent-color",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme
  })

  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem(accentStorageKey) || "#3b82f6"
  })

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  useEffect(() => {
    const root = window.document.documentElement
    root.style.setProperty('--primary-color', accentColor)
    
    // Also update oklch primary if possible, but for simplicity we'll use --primary-color in our components
    // Or we can convert hex to oklch if we want to be fancy.
    // For now, let's just use the hex color.
  }, [accentColor])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
    accentColor,
    setAccentColor: (color: string) => {
      localStorage.setItem(accentStorageKey, color)
      setAccentColor(color)
    }
  }

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
