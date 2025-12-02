import { NextRequest, NextResponse } from "next/server"

import { requireAuth } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { id: userId } = await requireAuth()

    const notes = await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json({ notes })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.error("[NOTES_GET]", error)
    return NextResponse.json({ error: "Failed to load notes" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { id: userId } = await requireAuth()
    const body = await request.json()

    const {
      title,
      summary,
      transcript,
      contentMd,
      audioUrl,
    }: {
      title?: string
      summary?: string
      transcript?: string
      contentMd?: string
      audioUrl?: string
    } = body

    if (!title && !summary && !transcript) {
      return NextResponse.json(
        {
          error: "At least one of title, summary, or transcript must be provided",
        },
        { status: 400 }
      )
    }

    const note = await prisma.note.create({
      data: {
        userId,
        title,
        summary,
        transcript,
        contentMd,
        audioUrl,
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

    console.error("[NOTES_POST]", error)
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 })
  }
}




