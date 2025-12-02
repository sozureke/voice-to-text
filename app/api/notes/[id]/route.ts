import { NextRequest, NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

async function getNoteOrThrow(id: string, userId: string) {
  const note = await prisma.note.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      id: true,
      title: true,
      summary: true,
      transcript: true,
      contentMd: true,
      audioUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!note) {
    return null
  }

  return note
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await requireAuth()
    const { id } = await params
    const note = await getNoteOrThrow(id, userId)

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    return NextResponse.json({ note })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("[NOTE_GET]", error)
    return NextResponse.json({ error: "Failed to load note" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await requireAuth()
    const { id } = await params
    const existing = await getNoteOrThrow(id, userId)

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, summary, transcript, contentMd, audioUrl } = body as {
      title?: string | null
      summary?: string | null
      transcript?: string | null
      contentMd?: string | null
      audioUrl?: string | null
    }

    const updated = await prisma.note.update({
      where: { id: existing.id },
      data: {
        title: title ?? existing.title,
        summary: summary ?? existing.summary,
        transcript: transcript ?? existing.transcript,
        contentMd: contentMd ?? existing.contentMd,
        audioUrl: audioUrl ?? existing.audioUrl,
      },
      select: {
        id: true,
        title: true,
        summary: true,
        transcript: true,
        contentMd: true,
        audioUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ note: updated })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("[NOTE_PUT]", error)
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await requireAuth()
    const { id } = await params
    const existing = await getNoteOrThrow(id, userId)

    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    await prisma.note.delete({
      where: { id: existing.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("[NOTE_DELETE]", error)
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 })
  }
}

