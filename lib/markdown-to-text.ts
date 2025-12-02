export function markdownToText(markdown: string): string {
  if (!markdown) return ""

  let text = markdown

  text = text.replace(/```[\s\S]*?```/g, "")

  text = text.replace(/`([^`]+)`/g, "$1")

  text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1")

  let previousText = ""
  while (text !== previousText) {
    previousText = text
    text = text.replace(/\*\*([^*]+)\*\*/g, "$1")
  }

  text = text.replace(/([^\s*])\*([^*\n]+)\*/g, "$1$2")
  text = text.replace(/([^\s_])_([^_\n]+)_/g, "$1$2")

  const lines = text.split("\n")
  const processedLines = lines.map((line) => {
    const bulletMatch = line.match(/^(\s*)[-*+]\s+(.+)$/)
    if (bulletMatch) {
      const indent = bulletMatch[1]
      const content = bulletMatch[2]
      return `${indent}• ${content}`
    }
    return line
  })
  text = processedLines.join("\n")

  text = text.replace(/^---+$/gm, "")

  text = text.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")

  text = text.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")

  text = text.replace(/\n{3,}/g, "\n\n")

  text = text
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")

  text = text.trim()

  return text
}
