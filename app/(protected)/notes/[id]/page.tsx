import Link from "next/link"
import { notFound } from "next/navigation"

import { DeleteNoteButton } from "@/components/delete-note-button"
import { TranscriptViewer } from "@/components/transcript-viewer"
import { getSession } from "@/lib/auth-helpers"
import { markdownToText } from "@/lib/markdown-to-text"
import { prisma } from "@/lib/prisma"

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  try {
    const session = await getSession()

    if (!session?.user?.id) return null

    const { id } = await params
    if (!id) notFound()

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!note) notFound()

    return (
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between font-mono text-sm text-muted-foreground">
          <Link href="/notes/list" className="hover:text-white transition-colors">
            &lt back to notes
          </Link>
          <span>note:{note.id.slice(0, 8)}</span>
        </div>

        <div className="border border-border p-6 space-y-4">
          <div className="font-mono text-2xl text-white">{note.title || "untitled note"}</div>
          <div className="text-xs text-muted-foreground font-mono">
            created {note.createdAt.toLocaleString()} │ updated {note.updatedAt.toLocaleString()}
          </div>
          {note.summary && (
            <div className="border border-border p-4">
              <div className="font-mono text-sm text-white mb-2">
                <span>&gt;</span> summary
              </div>
              <p className="text-muted-foreground text-sm">{note.summary}</p>
            </div>
          )}
          {note.transcript && (
            <TranscriptViewer transcript={note.transcript} />
          )}
          {note.contentMd && (
            <div className="border border-border p-4">
              <div className="font-mono text-sm text-white mb-2">
                <span>&gt;</span> structured content
              </div>
              <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                {markdownToText(note.contentMd)}
              </div>
            </div>
          )}
          {!note.summary && !note.transcript && !note.contentMd && (
            <div className="text-muted-foreground text-sm font-mono">
              <span>&gt;</span> this note is empty. update it via PUT /api/notes/{note.id}.
            </div>
          )}
          {note.audioUrl && (
            <div className="border border-border p-4 space-y-2">
              <div className="font-mono text-sm text-white">
                <span>&gt;</span> audio reference
              </div>
              <Link
                href={note.audioUrl}
                className="text-white underline underline-offset-4 break-all text-sm"
              >
                {note.audioUrl}
              </Link>
            </div>
          )}
          <div className="flex items-center justify-end pt-4 border-t border-border">
            <DeleteNoteButton noteId={note.id} />
          </div>
        </div>
      </div>
    )
  } catch (error) {
    notFound()
  }
}

