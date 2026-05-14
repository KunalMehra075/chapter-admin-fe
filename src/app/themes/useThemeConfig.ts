import { useEffect, useState } from "react"

const STORAGE_KEY = "app-theme"

export function useThemeConfig() {
  const [theme, setTheme] = useState("light")

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      document.documentElement.classList.add(saved)
      setTheme(saved)
    }
  }, [])

  const changeTheme = (newTheme: string) => {
    document.documentElement.classList.remove(theme)

    document.documentElement.classList.add(newTheme)

    localStorage.setItem(STORAGE_KEY, newTheme)

    setTheme(newTheme)
  }

  return {
    theme,
    changeTheme,
  }
}