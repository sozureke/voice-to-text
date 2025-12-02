"use client"

interface ProcessingAnimationProps {
  animationFrame: number
  isMobile: boolean
}

export function ProcessingAnimation({ animationFrame, isMobile }: ProcessingAnimationProps) {
  const width = isMobile ? 30 : 40
  const height = 10
  const symbols = ["·", "░", "▒", "▓", "█", "▄", "▀", "@", "#", "*", "●", "▲", "■"]
  
  const generateAnimatedWave = () => {
    let wave = ""
    for (let line = height; line >= 1; line--) {
      let lineStr = ""
      for (let i = 0; i < width; i++) {
        const time = (animationFrame * 0.1) + (i * 0.3)
        const wave1 = Math.sin(time) * 3 + 5
        const wave2 = Math.sin(time * 1.5 + i * 0.2) * 2 + 4
        const wave3 = Math.sin(time * 0.7 + i * 0.4) * 1.5 + 3
        const combinedWave = (wave1 + wave2 + wave3) / 3
        
        const barHeight = Math.max(1, Math.min(height, Math.floor(combinedWave)))
        
        if (barHeight >= line) {
          const relativeHeight = barHeight / height
          const symbolIndex = Math.min(
            symbols.length - 1,
            Math.floor(relativeHeight * symbols.length)
          )
          let symbol = symbols[symbolIndex]
          
          if (line === barHeight && barHeight > height * 0.7) {
            const peakSymbols = ["@", "#", "*", "●", "▲", "■"]
            symbol = peakSymbols[Math.min(peakSymbols.length - 1, Math.floor((barHeight / height) * peakSymbols.length))]
          }
          
          lineStr += symbol
        } else {
          lineStr += " "
        }
      }
      wave += lineStr + "\n"
    }
    return wave.trimEnd()
  }

  return (
    <div className="flex flex-col items-center">
      <div className="text-muted-foreground mb-2 font-mono">
        <pre className="whitespace-pre leading-tight mx-auto" style={{ fontFamily: "monospace" }}>
          {generateAnimatedWave()}
        </pre>
      </div>
      <div className="text-white font-mono text-sm mt-4">processing...</div>
    </div>
  )
}

