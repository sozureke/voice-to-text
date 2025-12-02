"use client"

import { DeleteAnimation } from "@/components/delete-animation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface NoteItemProps {
  note: {
    id: string
    title: string | null
    summary: string | null
    createdAt: string
  }
}

export function NoteItem({ note }: NoteItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      await new Promise((resolve) => setTimeout(resolve, 800))
      
      router.refresh()
    } catch (error) {
      console.error("Error deleting note:", error)
      setIsDeleting(false)
      setShowConfirm(false)
      alert("Failed to delete note. Please try again.")
    }
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setShowConfirm(false)
  }

  return (
    <div
      className={`block border border-border transition-opacity duration-500 ${
        isDeleting ? "opacity-70 pointer-events-none" : "hover:bg-muted"
      }`}
    >
      {isDeleting ? (
        <div className="p-4">
          <DeleteAnimation isActive={isDeleting} />
        </div>
      ) : (
        <>
          <Link href={`/notes/${note.id}`} className="block">
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                <span>&gt; {note.createdAt}</span>
                <div className="flex items-center gap-3">
                  <span>id:{note.id.slice(0, 8)}</span>
                  <button
                    onClick={handleDelete}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={`px-2 py-1 border border-border text-xs font-mono transition-colors ${
                      showConfirm
                        ? "border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        : "text-muted-foreground hover:text-white hover:border-white"
                    }`}
                  >
                    {showConfirm ? "✓" : "×"}
                  </button>
                </div>
              </div>
              <div className="font-mono text-lg text-white">{note.title || "untitled note"}</div>
              {note.summary ? (
                <p className="text-muted-foreground text-sm">{note.summary}</p>
              ) : (
                <p className="text-muted-foreground text-sm italic">summary pending...</p>
              )}
            </div>
          </Link>
          {showConfirm && (
            <div className="px-4 pb-4 border-t border-border pt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono text-xs transition-colors"
                >
                  <span>&gt;</span> confirm
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1 border border-border text-white hover:bg-muted font-mono text-xs transition-colors"
                >
                  <span>&gt;</span> cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

