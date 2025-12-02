import { requireAuth } from "@/lib/auth-helpers"
import { processAudioToNote } from "@/lib/openrouter"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const { id: userId } = await requireAuth()

    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      )
    }

    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "File must be an audio file" },
        { status: 400 }
      )
    }

    const { transcript, summary, structuredContent } =
      await processAudioToNote(audioFile)

    const title = summary.split(".")[0]?.substring(0, 100) || "Untitled Note"

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        summary,
        transcript,
        contentMd: structuredContent,
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

    return NextResponse.json({ note }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("Transcription error:", error)
    return NextResponse.json(
      {
        error: "Failed to process audio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

