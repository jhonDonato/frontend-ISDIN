const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="w-full border-t">
      <div className="mx-auto max-w-5xl px-4 py-4 text-center text-sm text-muted-foreground">
        Hackathon ISDIN — {currentYear}
      </div>
    </footer>
  )
}
