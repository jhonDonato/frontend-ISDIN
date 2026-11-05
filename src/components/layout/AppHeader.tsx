import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'

interface AppHeaderProps {
  title: string
  description?: string
}

export function AppHeader({ title, description }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-md supports-backdrop-filter:bg-background/60 md:px-6">
      <SidebarTrigger />
      <Separator orientation="vertical" className="h-5" />

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold tracking-tight sm:text-base">{title}</h1>
        {description && <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>}
      </div>
    </header>
  )
}
