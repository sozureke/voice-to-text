"use client"

import { useState } from "react"

interface TranscriptViewerProps {
  transcript: string
}

export const TranscriptViewer = ({ transcript }: TranscriptViewerProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="border border-border p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full font-mono text-sm text-white mb-2 hover:text-muted-foreground transition-colors"
      >
        <span>
          <span>&gt;</span> transcript
          {!isExpanded && transcript.length > 100 && (
            <span className="text-muted-foreground ml-2">
              ({transcript.length} chars - click to expand)
            </span>
          )}
        </span>
        <span className="text-muted-foreground text-xs">
          {isExpanded ? "[-]" : "[+]"}
        </span>
      </button>
      {isExpanded && (
        <div className="mt-2">
          <p className="text-muted-foreground whitespace-pre-wrap text-sm">
            {transcript}
          </p>
        </div>
      )}
      {!isExpanded && (
        <div className="mt-2">
          <p className="text-muted-foreground whitespace-pre-wrap text-sm line-clamp-3">
            {transcript}
          </p>
        </div>
      )}
    </div>
  )
}
