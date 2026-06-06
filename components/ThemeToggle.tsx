'use client'

import { useTheme } from './ThemeProvider'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-xl border border-cdl-border bg-cdl-surface px-3 py-2 text-xs font-bold uppercase tracking-wider text-cdl-accent shadow-cdl transition-colors hover:bg-cdl-hover ${className}`}
      aria-label={
        theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'
      }
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      <span aria-hidden className="text-base leading-none">
        {theme === 'dark' ? '☀' : '☾'}
      </span>
      <span>{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
    </button>
  )
}
