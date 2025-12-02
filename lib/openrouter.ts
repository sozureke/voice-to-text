const getBackendUrl = (): string => {
  return process.env.BACKEND_URL || "http://localhost:8000"
}

export const processAudioToNote = async (audioFile: File | Blob): Promise<{
  transcript: string
  summary: string
  structuredContent: string
}> => {
  const backendUrl = getBackendUrl()
  const formData = new FormData()
  formData.append("audio", audioFile)

  try {
    const response = await fetch(`${backendUrl}/process-audio`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Audio processing failed: ${response.status} ${errorText}`
      )
    }

    const data = await response.json()
    
    if (!data.transcript || !data.summary || !data.structured_content) {
      throw new Error("Backend returned incomplete response")
    }

    return {
      transcript: data.transcript,
      summary: data.summary,
      structuredContent: data.structured_content,
    }
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          `Cannot connect to backend at ${backendUrl}. Please ensure the Python backend is running.`
        )
      }
      throw error
    }
    throw new Error("Unknown error during audio processing")
  }
}

export const transcribeAudio = async (audioFile: File | Blob): Promise<string> => {
  const backendUrl = getBackendUrl()
  const formData = new FormData()
  formData.append("audio", audioFile)

  try {
    const response = await fetch(`${backendUrl}/transcribe`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Transcription failed: ${response.status} ${errorText}`
      )
    }

    const data = await response.json()
    if (!data.transcript) {
      throw new Error("Backend returned empty transcript")
    }

    return data.transcript
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          `Cannot connect to backend at ${backendUrl}. Please ensure the Python backend is running.`
        )
      }
      throw error
    }
    throw new Error("Unknown error during transcription")
  }
}

export const generateSummary = async (
  transcript: string,
  model: string = "openai/gpt-4o-mini"
): Promise<string> => {
  const backendUrl = getBackendUrl()
  
  try {
    const response = await fetch(`${backendUrl}/summary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, model }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Summary generation failed: ${errorText}`)
    }

    const data = await response.json()
    return data.summary || ""
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          `Cannot connect to backend at ${backendUrl}. Please ensure the Python backend is running.`
        )
      }
      throw error
    }
    throw new Error("Unknown error during summary generation")
  }
}

export const structureTranscript = async (
  transcript: string,
  summary?: string,
  model: string = "openai/gpt-4o-mini"
): Promise<string> => {
  const backendUrl = getBackendUrl()
  
  try {
    const response = await fetch(`${backendUrl}/structure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ transcript, summary, model }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Structuring failed: ${errorText}`)
    }

    const data = await response.json()
    return data.structured_content || ""
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("fetch failed") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Failed to fetch")
      ) {
        throw new Error(
          `Cannot connect to backend at ${backendUrl}. Please ensure the Python backend is running.`
        )
      }
      throw error
    }
    throw new Error("Unknown error during structuring")
  }
}
