"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function NavTabs() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isRecordPage = pathname === "/notes" || pathname === "/"
  const isNotesPage = pathname === "/notes/list"

  return (
    <>
      {/* Desktop tabs */}
      <div className="hidden md:flex items-baseline font-mono text-sm border border-border">
        <Link
          href="/notes"
          className={`px-4 py-2 border-r border-border transition-colors inline-flex items-baseline ${
            isRecordPage
              ? "bg-white text-black"
              : "bg-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <span className="mr-2">&gt;</span> record
        </Link>
        <Link
          href="/notes/list"
          className={`px-4 py-2 transition-colors inline-flex items-baseline ${
            isNotesPage
              ? "bg-white text-black"
              : "bg-transparent text-muted-foreground hover:text-white"
          }`}
        >
          <span className="mr-2">&gt;</span> notes
        </Link>
      </div>

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden font-mono text-sm border border-border px-3 py-2"
        aria-label="Toggle menu"
      >
        <span>&gt;</span> {mobileMenuOpen ? "close" : "menu"}
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-black border-b border-border md:hidden z-50">
          <div className="flex flex-col font-mono text-sm">
            <Link
              href="/notes"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 border-b border-border transition-colors ${
                isRecordPage
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <span className="mr-2">&gt;</span> record
            </Link>
            <Link
              href="/notes/list"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-4 py-3 border-b border-border transition-colors ${
                isNotesPage
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              <span className="mr-2">&gt;</span> notes
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

