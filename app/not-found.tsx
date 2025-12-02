import { getSession } from "@/lib/auth-helpers"
import Link from "next/link"

export default async function NotFound() {
  const session = await getSession()

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-fade-in-up">
        <div className="border border-border p-6 space-y-6 animate-subtle-glow">
          <div className="space-y-4">
            <div className="font-mono text-2xl text-white animate-fade-in">
              <span>&gt;</span> 404 - page not found
              <span className="blink-cursor ml-1"></span>
            </div>
            <div className="terminal-line animate-fade-in delay-300"></div>
            <div className="text-muted-foreground text-sm font-mono space-y-2">
              <div className="animate-fade-in delay-400">
                <span>&gt;</span> the requested page does not exist.
              </div>
              <div className="animate-fade-in delay-500">
                <span>&gt;</span> check the url and try again.
              </div>
            </div>
          </div>

          <div className="terminal-line animate-fade-in delay-600"></div>

          <div className="flex flex-wrap gap-4">
            {session ? (
              <>
                <Link
                  href="/notes"
                  className="px-4 py-2 border border-border bg-white text-black hover:bg-muted hover:text-white font-mono transition-colors inline-flex items-center gap-2"
                >
                  <span>&gt;</span> go to home
                </Link>
                <Link
                  href="/notes/list"
                  className="px-4 py-2 border border-border text-white hover:bg-muted font-mono transition-colors inline-flex items-center gap-2"
                >
                  <span>&gt;</span> go to my notes
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  className="px-4 py-2 border border-border bg-white text-black hover:bg-muted hover:text-white font-mono transition-colors inline-flex items-center gap-2"
                >
                  <span>&gt;</span> go home
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 border border-border text-white hover:bg-muted font-mono transition-colors inline-flex items-center gap-2"
                >
                  <span>&gt;</span> sign in
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

