'use client'

import { useEffect, useRef, useState } from 'react'
import {
  helpHintStorageKey,
  pickHintForRoute,
} from '@/components/help/helpHints'

const DISCREET_DELAY_MS = 5000
const HINT_DELAY_MS = 8000
const SCROLL_IDLE_MS = 700

export type FloatingHelpVisualState = 'normal' | 'discreet' | 'minimized'

export function useFloatingHelpBehavior(pathname: string, panelOpen: boolean) {
  const [visualState, setVisualState] = useState<FloatingHelpVisualState>('normal')
  const [hintText, setHintText] = useState<string | null>(null)
  const [hintVisible, setHintVisible] = useState(false)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const discreetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setVisualState('normal')
    setHintVisible(false)
    setHintText(null)

    discreetTimerRef.current = setTimeout(() => {
      if (!panelOpen) setVisualState('discreet')
    }, DISCREET_DELAY_MS)

    const hintKey = helpHintStorageKey(pathname)
    const dismissed =
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(hintKey) === '1'

    if (!dismissed) {
      hintTimerRef.current = setTimeout(() => {
        if (!panelOpen) {
          setHintText(pickHintForRoute(pathname))
          setHintVisible(true)
        }
      }, HINT_DELAY_MS)
    }

    return () => {
      if (discreetTimerRef.current) clearTimeout(discreetTimerRef.current)
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current)
    }
  }, [pathname, panelOpen])

  useEffect(() => {
    if (panelOpen) {
      setHintVisible(false)
      setVisualState('normal')
      return
    }

    function onScroll() {
      setVisualState('minimized')
      setHintVisible(false)

      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
      scrollTimerRef.current = setTimeout(() => {
        setVisualState('discreet')
      }, SCROLL_IDLE_MS)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [panelOpen])

  function dismissHint() {
    setHintVisible(false)
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(helpHintStorageKey(pathname), '1')
    }
  }

  return {
    visualState,
    hintText,
    hintVisible,
    dismissHint,
    clearHint: () => setHintVisible(false),
  }
}
