"use client"

import * as React from "react"
import { Settings2, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { useThemeConfig } from "./useThemeConfig"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const themes = [
  {
    id: "theme-rose",
    label: "Rose",
    color: "#ff5c67",
    bgColor: "#fff0f4",
    borderColor: "#ff8b8d",
  },
  {
    id: "theme-violet",
    label: "Violet",
    color: "#7c3aed",
    bgColor: "#f5f3ff",
    borderColor: "#a78bfa",
  },
  {
    id: "theme-sapphire",
    label: "Sapphire",
    color: "#2563eb",
    bgColor: "#eff6ff",
    borderColor: "#93c5fd",
  },
  {
    id: "theme-emerald",
    label: "Emerald",
    color: "#059669",
    bgColor: "#ecfdf5",
    borderColor: "#6ee7b7",
  },
  {
    id: "theme-amber",
    label: "Amber",
    color: "#d97706",
    bgColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  {
    id: "theme-slate",
    label: "Slate",
    color: "#475569",
    bgColor: "#f8fafc",
    borderColor: "#94a3b8",
  },
]

const modes = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
]

export function ThemeSwitcher() {
  const { theme: currentMode, setTheme } = useTheme()
  const { theme:activeTheme, changeTheme } = useThemeConfig()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "fixed top-3 right-3 h-9 w-9 rounded-xl border transition-all duration-200",
            "border-[--pink]/30 bg-[--pink-pale]",
            "hover:border-[--pink] hover:bg-[--pink-soft] hover:shadow-sm",
            "focus-visible:ring-[--pink]/40"
          )}
          aria-label="Open appearance settings"
        >
          <Settings2
            className="h-4 w-4 text-[--pink] transition-transform duration-300 hover:rotate-45"
            strokeWidth={1.8}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn(
          "w-[240px] rounded-2xl p-4",
          "border border-[--pink]/15 bg-background/95 backdrop-blur-md",
          "shadow-[0_8px_32px_rgba(255,92,103,0.12)]"
        )}
      >
        {/* Mode section */}
        <div className="mb-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-[--pink]">
            Mode
          </p>
          <div className="flex gap-1.5 rounded-xl border border-[--pink]/10 bg-muted/40 p-1">
            {modes.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all duration-200",
                  currentMode === id
                    ? "bg-background text-[--pink] shadow-sm ring-1 ring-[--pink]/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        {/* <div className="mb-0 bg-[--pink]/2" /> */}

        {/* Theme section */}
        <div>
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-[--pink]">
            Theme
          </p>
          <div className="grid grid-cols-6 gap-2">
            {themes.map(({ id, label, color, bgColor, borderColor }) => (
              <button
                key={id}
                onClick={() => changeTheme(id)}
                title={label}
                aria-label={`${label} theme`}
                style={{
                  "--swatch-color": color,
                  "--swatch-bg": bgColor,
                  "--swatch-border": borderColor,
                } as React.CSSProperties}
                className={cn(
                  "group relative h-7 w-full rounded-lg transition-all duration-200 rounded-full",
                  "border-2",
              activeTheme === id
                    ? "scale-110 border-[--swatch-color] shadow-[0_0_0_2px_var(--swatch-bg)]"
                    : "border-transparent hover:scale-105 hover:border-[--swatch-border]"
                )}
              >
                <span
                  className="block h-full w-full rounded-full"
                  style={{ backgroundColor: color }}
                />
                {activeTheme === id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg
                      width="10"
                      height="8"
                      viewBox="0 0 10 8"
                      fill="none"
                      className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]"
                    >
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Active theme name */}
          <p className="mt-2.5 text-center text-[11px] text-muted-foreground">
            {themes.find((t) => t.id === activeTheme)?.label ?? "Rose"}{" "}
            <span className="text-[--pink]">●</span>
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}