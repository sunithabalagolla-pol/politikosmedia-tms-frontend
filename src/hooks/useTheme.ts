import { useState, useEffect, useCallback, useSyncExternalStore } from 'react'

// Shared theme store so all useTheme() instances stay in sync
let listeners: Array<() => void> = []
function emitChange() {
  listeners.forEach(l => l())
}

function getTheme(): 'light' | 'dark' {
  return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
}

function subscribe(listener: () => void) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter(l => l !== listener)
  }
}

function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
  localStorage.setItem('theme', theme)
  emitChange()
}

// Initialize on load
applyTheme(getTheme())

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme)

  const setTheme = useCallback((value: 'light' | 'dark') => {
    applyTheme(value)
  }, [])

  const toggleTheme = useCallback(() => {
    applyTheme(getTheme() === 'light' ? 'dark' : 'light')
  }, [])

  return { theme, setTheme, toggleTheme }
}
