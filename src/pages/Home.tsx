import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-8rem)] w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-12 text-center">
      <Badge variant="secondary">Hackathon ISDIN</Badge>

      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Frontend listo para construir
      </h1>

      <p className="max-w-2xl text-muted-foreground">
        Proyecto base con React, TypeScript, Vite, Tailwind CSS y shadcn/ui.
        Reemplaza este contenido por la solución del equipo.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button>Comenzar</Button>
        <Button variant="outline">Ver documentación</Button>
      </div>

      <Card className="mt-8 w-full max-w-md text-left">
        <CardHeader>
          <CardTitle>Stack configurado</CardTitle>
          <CardDescription>
            Todo listo para que el equipo empiece a desarrollar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>React 19 + TypeScript</li>
            <li>Vite</li>
            <li>Tailwind CSS v4</li>
            <li>shadcn/ui</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  )
}
