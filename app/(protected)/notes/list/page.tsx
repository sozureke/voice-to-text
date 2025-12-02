import Link from "next/link"

import { NoteItem } from "@/components/note-item"
import { getSession } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

export default async function NotesListPage() {
  const session = await getSession()

  if (!session?.user?.id) return null
 
  const notes = await prisma.note.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
      {notes.length > 0 && (
        <div className="border border-border p-4">
          <div className="font-mono text-sm text-white mb-2">
            <span>&gt;</span> notes feed
          </div>
          <div className="text-muted-foreground text-xs font-mono">
            ──────────────────────────────────────────────
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.length === 0 && (
          <div className="border border-border p-6 font-mono text-sm">
            <div className="text-muted-foreground mb-4">
              <span>&gt;</span> no notes yet.
            </div>
            <Link
              href="/notes"
              className="inline-flex items-center gap-2 px-4 py-2 border border-border bg-white text-black hover:bg-muted hover:text-white font-mono transition-colors"
            >
              <span>&gt;</span> go to record tab
            </Link>
          </div>
        )}

        {notes.map((note) => (
          <NoteItem
            key={note.id}
            note={{
              ...note,
              createdAt: formatDate(note.createdAt),
            }}
          />
        ))}
      </div>
      </div>
    </div>
  )
}


