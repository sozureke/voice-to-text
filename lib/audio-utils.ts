export function isZenBrowser(): boolean {
  if (typeof window === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes("zen") || ua.includes("zen browser")
}

export function generateASCIIWaveform(waveformData: number[], isMobile: boolean = false): string {
  if (waveformData.length === 0) {
    const width = isMobile ? 30 : 40
    return "─".repeat(width)
  }

  const symbols = ["·", "░", "▒", "▓", "█", "▄", "▀", "@", "#", "*", "●", "▲", "■"]
  const height = 10
  const width = waveformData.length

  const normalized = waveformData.map((val, idx) => {
    const prev = idx > 0 ? waveformData[idx - 1] : val
    const next = idx < waveformData.length - 1 ? waveformData[idx + 1] : val
    const smoothed = (prev + val + next) / 3
 
    return Math.max(1, Math.floor((smoothed / 100) * height))
  })

  let asciiWave = ""

  for (let line = height; line >= 1; line--) {
    let lineStr = ""
    for (let i = 0; i < width; i++) {
      const barHeight = normalized[i]
   
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
    asciiWave += lineStr + "\n"
  }

  return asciiWave.trimEnd()
}



