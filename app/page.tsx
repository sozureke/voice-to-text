import { getSession } from "@/lib/auth-helpers"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getSession()

  if (session) {
    redirect("/notes")
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-muted-foreground font-mono text-xs">
          <div className="border-t border-l border-r border-border p-2">
            <div className="flex items-center gap-2 mb-2 text-white">
              <span>&gt;</span>
              <span>AI Voice-to-Notes</span>
            </div>
            <div className="text-muted-foreground text-sm">
              <span>&gt;</span> ready.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border p-6">
            <h1 className="text-3xl font-mono text-white mb-4">
              Voice to Notes
            </h1>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Record voice notes, transcribe them, and convert them into structured text notes using AI.
            </p>

            <div className="flex gap-4 justify-start mb-8">
              <Link
                href="/login"
                className="px-4 py-2 border border-border bg-white text-black hover:bg-muted hover:text-white font-mono transition-colors inline-flex items-center gap-2"
              >
                <span>&gt;</span> sign in
              </Link>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="border border-border p-4">
              <div className="font-mono text-white mb-2">
                <span>&gt;</span> record
              </div>
              <div className="text-muted-foreground text-sm mb-2">
                Record voice notes directly from your browser
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                ──────────────────────────────
              </div>
            </div>
            <div className="border border-border p-4">
              <div className="font-mono text-white mb-2">
                <span>&gt;</span> transcribe
              </div>
              <div className="text-muted-foreground text-sm mb-2">
                Automatic speech-to-text transcription
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                ──────────────────────────────
              </div>
            </div>
            <div className="border border-border p-4">
              <div className="font-mono text-white mb-2">
                <span>&gt;</span> structure
              </div>
              <div className="text-muted-foreground text-sm mb-2">
                AI-powered structuring and summarization
              </div>
              <div className="text-muted-foreground text-xs font-mono">
                ──────────────────────────────
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
