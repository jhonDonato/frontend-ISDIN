import { useEffect, useRef, useState } from 'react'

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Interpola suavemente un número hacia su nuevo valor en cada cambio,
 * sin reiniciar la animación si el valor no cambió. Respeta
 * prefers-reduced-motion saltando directo al valor final.
 */
export function useAnimatedNumber(value: number, duration = 800): number {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (fromRef.current === value) return

    if (prefersReducedMotion()) {
      fromRef.current = value
      setDisplay(value)
      return
    }

    const from = fromRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = easeOutCubic(t)
      setDisplay(from + (value - from) * eased)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = value
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, duration])

  return display
}
