"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

interface DeleteNoteButtonProps {
  noteId: string
}

export const DeleteNoteButton = ({ noteId }: DeleteNoteButtonProps) => {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete note")
      }

      router.push("/notes/list")
      router.refresh()
    } catch (error) {
      console.error("Error deleting note:", error)
      setIsDeleting(false)
      setShowConfirm(false)
      alert("Failed to delete note. Please try again.")
    }
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-mono transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeleting ? "deleting..." : "confirm delete"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="px-4 py-2 border border-border text-white hover:bg-muted font-mono transition-colors inline-flex items-center gap-2 disabled:opacity-50"
        >
          cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 border border-border text-white hover:bg-muted font-mono transition-colors inline-flex items-center gap-2"
    >
      <span>&gt;</span> delete note
    </button>
  )
}

