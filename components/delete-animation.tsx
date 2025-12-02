"use client"

import { useEffect, useState } from "react"

interface DeleteAnimationProps {
  isActive: boolean
  onComplete?: () => void
}

export function DeleteAnimation({ isActive, onComplete }: DeleteAnimationProps) {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setFrame(0)
      return
    }

    const interval = setInterval(() => {
      setFrame((prev) => {
        if (prev >= 8) {
          clearInterval(interval)
          onComplete?.()
          return prev
        }
        return prev + 1
      })
    }, 80)

    return () => clearInterval(interval)
  }, [isActive, onComplete])

  if (!isActive) return null

  const deletionChars = ["█", "▓", "▒", "░", "·", "#", "*", ".", " "]
  const currentChar = deletionChars[Math.min(frame, deletionChars.length - 1)]

  const generatePattern = () => {
    const width = 50
    const lines = 4
    let pattern = ""
    
    for (let line = 0; line < lines; line++) {
      let lineStr = ""
      const progress = frame / 8
      const startPos = Math.floor(progress * width)
      const waveOffset = line * 2
      
      for (let i = 0; i < width; i++) {
        if (i < startPos - 2) {
          lineStr += " "
        } else if (i >= startPos - 2 && i <= startPos + 2) {
          const distance = Math.abs(i - startPos)
          const deletionChars = ["█", "▓", "▒", "░", "·"]
          const charIndex = Math.min(distance, deletionChars.length - 1)
          lineStr += deletionChars[charIndex]
        } else {
          const contentChars = ["─", "━", "═", "─"]
          const charIndex = (i + waveOffset) % contentChars.length
          lineStr += contentChars[charIndex]
        }
      }
      pattern += lineStr + "\n"
    }
    
    return pattern.trimEnd()
  }

  return (
    <div className="font-mono text-xs text-muted-foreground">
      <pre className="whitespace-pre leading-tight" style={{ fontFamily: "monospace" }}>
        {generatePattern()}
      </pre>
      <div className="mt-2 text-xs">
        <span>&gt;</span> deleting
        <span className="inline-block animate-blink ml-1">_</span>
      </div>
    </div>
  )
}

