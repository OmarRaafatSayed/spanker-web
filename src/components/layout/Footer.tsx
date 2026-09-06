// =============================================================================
// Footer — minimal portal footer
// =============================================================================

import Link from "next/link"

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-background mt-auto">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© {year} Spanker Travel. All rights reserved.</p>
        <nav className="flex gap-4" aria-label="Footer navigation">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          <Link href="/requests"  className="hover:text-foreground transition-colors">Requests</Link>
          <Link href="/documents" className="hover:text-foreground transition-colors">Documents</Link>
        </nav>
      </div>
    </footer>
  )
}
