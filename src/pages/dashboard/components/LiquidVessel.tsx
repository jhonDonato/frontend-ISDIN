import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber'
import { cn } from '@/lib/utils'

export type LiquidColorKey = 'amber' | 'blue' | 'violet' | 'emerald' | 'red'

const FILL_CLASS: Record<LiquidColorKey, string> = {
  amber: 'bg-gradient-to-t from-amber-500/80 to-amber-400/60 dark:from-amber-500/55 dark:to-amber-400/35',
  blue: 'bg-gradient-to-t from-blue-500/80 to-blue-400/60 dark:from-blue-500/55 dark:to-blue-400/35',
  violet: 'bg-gradient-to-t from-violet-500/80 to-violet-400/60 dark:from-violet-500/55 dark:to-violet-400/35',
  emerald: 'bg-gradient-to-t from-emerald-500/80 to-emerald-400/60 dark:from-emerald-500/55 dark:to-emerald-400/35',
  red: 'bg-gradient-to-t from-red-500/80 to-red-400/60 dark:from-red-500/55 dark:to-red-400/35',
}

const WAVE_FILL_CLASS: Record<LiquidColorKey, string> = {
  amber: 'fill-amber-300/70 dark:fill-amber-300/30',
  blue: 'fill-blue-300/70 dark:fill-blue-300/30',
  violet: 'fill-violet-300/70 dark:fill-violet-300/30',
  emerald: 'fill-emerald-300/70 dark:fill-emerald-300/30',
  red: 'fill-red-300/70 dark:fill-red-300/30',
}

const RING_CLASS: Record<LiquidColorKey, string> = {
  amber: 'border-amber-400/70',
  blue: 'border-blue-400/70',
  violet: 'border-violet-400/70',
  emerald: 'border-emerald-400/70',
  red: 'border-red-400/70',
}

interface LiquidVesselProps {
  label: string
  count: number
  total: number
  to: string
  color: LiquidColorKey
  style?: React.CSSProperties
}

export function LiquidVessel({ label, count, total, to, color, style }: LiquidVesselProps) {
  const targetPct = total > 0 ? Math.min(100, Math.max(0, (count / total) * 100)) : 0
  const displayCount = useAnimatedNumber(count)
  const displayPct = total > 0 ? Math.min(100, Math.max(0, (displayCount / total) * 100)) : 0

  const [justCompleted, setJustCompleted] = useState(false)
  const prevPctRef = useRef(targetPct)
  useEffect(() => {
    const prev = prevPctRef.current
    prevPctRef.current = targetPct
    if (prev < 100 && targetPct >= 100) {
      setJustCompleted(true)
      const timeout = setTimeout(() => setJustCompleted(false), 1100)
      return () => clearTimeout(timeout)
    }
  }, [targetPct])

  const roundedPct = Math.round(targetPct)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            aria-label={`${label}: ${count} documentos, ${roundedPct}%`}
            className="group/vessel flex animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards flex-col items-center gap-2 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            style={style}
          />
        }
      >
        <div
          className={cn(
            'relative h-40 w-full max-w-24 overflow-hidden rounded-2xl border border-foreground/10',
            'bg-gradient-to-b from-foreground/[0.035] to-foreground/[0.01] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]',
            'transition-transform duration-200 ease-out group-hover/vessel:-translate-y-1',
            'sm:h-48',
          )}
        >
          {/* brillo de vidrio, decorativo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent dark:from-white/[0.06]"
          />

          {/* líquido */}
          <div
            aria-hidden
            className={cn('absolute inset-x-0 bottom-0', FILL_CLASS[color])}
            style={{ height: `${displayPct}%` }}
          >
            <LiquidWaveSurface color={color} />
          </div>

          {justCompleted && (
            <span
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 rounded-2xl border-2 [animation:liquid-complete-pulse_1.1s_ease-out]',
                RING_CLASS[color],
              )}
            />
          )}

          {/* lectura */}
          <div className="relative z-10 flex h-full flex-col items-center justify-center gap-0.5 px-1 text-center">
            <span className="text-lg font-semibold tabular-nums text-foreground drop-shadow-[0_1px_1px_rgba(0,0,0,0.12)] sm:text-xl">
              {roundedPct}%
            </span>
            <span className="text-[11px] tabular-nums text-foreground/70">{Math.round(displayCount)} docs</span>
          </div>
        </div>

        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </TooltipTrigger>
      <TooltipContent>
        {label}: {count} documentos ({roundedPct}%)
      </TooltipContent>
    </Tooltip>
  )
}

function LiquidWaveSurface({ color }: { color: LiquidColorKey }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-2 h-4 overflow-hidden">
      <div className="flex h-full w-[200%] motion-safe:[animation:liquid-wave-slow_9s_linear_infinite]">
        <WavePath className="h-full w-1/2 shrink-0 fill-white/25 dark:fill-white/[0.08]" />
        <WavePath className="h-full w-1/2 shrink-0 fill-white/25 dark:fill-white/[0.08]" />
      </div>
      <div className="absolute inset-0 flex h-full w-[200%] motion-safe:[animation:liquid-wave-fast_5.5s_linear_infinite]">
        <WavePath className={cn('h-full w-1/2 shrink-0', WAVE_FILL_CLASS[color])} />
        <WavePath className={cn('h-full w-1/2 shrink-0', WAVE_FILL_CLASS[color])} />
      </div>
    </div>
  )
}

function WavePath({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 20" preserveAspectRatio="none" className={className}>
      <path d="M0,10 C37.5,18 112.5,2 150,10 C187.5,18 262.5,2 300,10 L300,20 L0,20 Z" />
    </svg>
  )
}
