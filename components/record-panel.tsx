"use client"

import { ProcessingAnimation } from "@/components/processing-animation"
import { Button } from "@/components/ui/button"
import { generateASCIIWaveform, isZenBrowser } from "@/lib/audio-utils"
import { formatTime } from "@/lib/time-utils"
import { useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useRef, useState } from "react"

type RecordingState = "idle" | "recording" | "processing" | "done" | "error"
type ProcessingStatus = "transcribing" | "structuring" | "done"

export function RecordPanel() {
  const [state, setState] = useState<RecordingState>("idle")
  const [timer, setTimer] = useState(0)
  const [waveformData, setWaveformData] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>("transcribing")
  const [animationFrame, setAnimationFrame] = useState(0)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (state === "processing") {
      const interval = setInterval(() => {
        setAnimationFrame((prev) => prev + 1)
      }, 100)
      return () => clearInterval(interval)
    }
  }, [state])

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const processAudioFile = async (audioInput: Blob, filename: string) => {
    setState("processing")
    setProcessingStatus("transcribing")
    setTimer(0)
    setWaveformData(new Array(40).fill(0))

    try {
      const formData = new FormData()
      formData.append("audio", audioInput, filename)

      const responsePromise = fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      const progressTimeout = window.setTimeout(() => {
        setProcessingStatus("structuring")
      }, 2000)

      const response = await responsePromise
      clearTimeout(progressTimeout)

      if (!response.ok) {
        let errorMessage = "Failed to transcribe audio"
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          errorMessage = data.error || errorMessage
          if (data.details) errorMessage += `: ${data.details}`
        } catch (e) {
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data.note || !data.note.id) throw new Error("Invalid response from server")

      const noteId = data.note.id as string
      setProcessingStatus("done")
      setState("done")
      router.refresh()

      setTimeout(async () => {
        try {
          if (noteId) {
            await router.push(`/notes/${noteId}`)
          } else {
            await router.push("/notes/list")
          }
        } catch (err) {
          console.error("Navigation error:", err)
          await router.push("/notes/list")
        } finally {
          setState("idle")
        }
      }, 2000)
    } catch (err) {
      console.error("Transcription error:", err)
      setError(err instanceof Error ? err.message : "Failed to process audio")
      setState("error")
    }
  }

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (analyserRef.current) {
        try {
          analyserRef.current.disconnect()
        } catch (e) {
        }
        analyserRef.current = null
      }
      if (audioSourceNodeRef.current) {
        try {
          audioSourceNodeRef.current.disconnect()
        } catch (e) {
        }
        audioSourceNodeRef.current = null
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
        }
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
   
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder API is not supported in this browser")
      }

      if (!window.isSecureContext && location.protocol !== "https:" && location.hostname !== "localhost") {
        throw new Error("Microphone access requires a secure connection (HTTPS). Please use HTTPS or localhost.")
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("MediaDevices API is not available. Please use a modern browser.")
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (getUserMediaError) {
        throw getUserMediaError
      }
   
      streamRef.current = stream

      if (!stream.active) {
        throw new Error("Media stream is not active")
      }

      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error("No audio tracks found in stream")
      }

      const readyTracks = audioTracks.filter(track => track.readyState === "live")
      if (readyTracks.length === 0) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        const tracksAfterWait = stream.getAudioTracks().filter(track => track.readyState === "live")
        if (tracksAfterWait.length === 0) {
          throw new Error("Audio tracks are not ready. Please check your microphone connection.")
        }
      }

      audioTracks.forEach(track => {
        if (track.readyState === "live" && !track.enabled) {
          track.enabled = true
        }
      })

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const audioSourceNode = audioContext.createMediaStreamSource(stream)
     
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.8
        audioSourceNode.connect(analyser)
     
        const dummyGain = audioContext.createGain()
        dummyGain.gain.value = 0
        analyser.connect(dummyGain)
        dummyGain.connect(audioContext.destination)
     
        audioContextRef.current = audioContext
        audioSourceNodeRef.current = audioSourceNode
        analyserRef.current = analyser
     
        const delay = isZenBrowser() ? 200 : 50
        await new Promise((resolve) => setTimeout(resolve, delay))
      } catch (audioContextError) {
        console.warn("AudioContext activation failed (non-critical):", audioContextError)
      }
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg",
      ]
   
      let selectedMimeType: string | undefined
      for (const mimeType of mimeTypes) {
        try {
          if (MediaRecorder.isTypeSupported(mimeType)) {
            selectedMimeType = mimeType
            break
          }
        } catch (e) {
          continue
        }
      }

      let mediaRecorder: MediaRecorder
   
      const streamDelay = isZenBrowser() ? 300 : 100
      await new Promise((resolve) => setTimeout(resolve, streamDelay))
   
      if (!stream.active) {
        throw new Error("Stream became inactive before MediaRecorder creation")
      }
   
      const createMediaRecorder = (): MediaRecorder => {
        const zenBrowser = isZenBrowser()
     
        if (zenBrowser) {
          const zenMimeTypes = [
            "audio/webm;codecs=opus",
            "audio/webm",
            "audio/mp4",
          ]
       
          for (const mimeType of zenMimeTypes) {
            try {
              if (MediaRecorder.isTypeSupported(mimeType)) {
                return new MediaRecorder(stream, { mimeType })
              }
            } catch (e) {
              continue
            }
          }
       
          try {
            return new MediaRecorder(stream)
          } catch (e) {
            console.warn("Zen browser MediaRecorder creation failed:", e)
          }
        }
     
        if (selectedMimeType && MediaRecorder.isTypeSupported(selectedMimeType)) {
          try {
            return new MediaRecorder(stream, { mimeType: selectedMimeType })
          } catch (e) {
            console.warn("Failed with selected MIME type, trying default:", e)
          }
        }
     
        try {
          return new MediaRecorder(stream)
        } catch (e) {
          console.warn("Failed without MIME type, trying with empty options:", e)
        }
     
        try {
          return new MediaRecorder(stream, {})
        } catch (e) {
          console.warn("Failed with empty options, trying with audioBitsPerSecond:", e)
        }
     
        try {
          return new MediaRecorder(stream, { audioBitsPerSecond: 128000 })
        } catch (e) {
          console.warn("Failed with audioBitsPerSecond:", e)
        }
     
        if (selectedMimeType) {
          try {
            return new MediaRecorder(stream, {
              mimeType: selectedMimeType,
              audioBitsPerSecond: 128000
            })
          } catch (e) {
            console.warn("Failed with MIME type and bits per second:", e)
          }
        }
     
        throw new Error("Failed to create MediaRecorder with any configuration")
      }

      try {
        mediaRecorder = createMediaRecorder()
     
        if (!mediaRecorder || typeof mediaRecorder.start !== "function") {
          throw new Error("MediaRecorder was not created properly")
        }
     
        console.log("MediaRecorder created successfully:", {
          mimeType: mediaRecorder.mimeType,
          state: mediaRecorder.state,
          streamActive: stream.active,
        })
      } catch (err) {
        const errorDetails = err instanceof Error ? err.message : String(err)
        const errorName = err instanceof Error ? err.name : "Unknown"
        console.error("MediaRecorder creation failed:", {
          error: errorDetails,
          errorName: errorName,
          streamActive: stream.active,
          audioTracks: stream.getAudioTracks().length,
          trackStates: stream.getAudioTracks().map(t => ({
            readyState: t.readyState,
            enabled: t.enabled,
            muted: t.muted,
            label: t.label,
          })),
          supportedTypes: mimeTypes.filter(mt => {
            try {
              return MediaRecorder.isTypeSupported(mt)
            } catch {
              return false
            }
          }),
        })
     
        throw new Error(
          `Failed to initialize MediaRecorder: ${errorDetails}. This may be a browser compatibility issue. Please try refreshing the page or using a different browser.`
        )
      }
   
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        const error = (event as any).error || new Error("MediaRecorder error occurred")
        setError(`Recording error: ${error.message || "Unknown error"}`)
        setState("error")
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
        if (audioSourceNodeRef.current) {
          try {
            audioSourceNodeRef.current.disconnect()
          } catch (e) {
          }
          audioSourceNodeRef.current = null
        }
        if (audioContextRef.current) {
          try {
            audioContextRef.current.close()
          } catch (e) {
          }
          audioContextRef.current = null
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        setWaveformData([])
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
     
        const blobType = mediaRecorder.mimeType || "audio/webm"
        const audioBlob = new Blob(audioChunksRef.current, {
          type: blobType,
        })
        audioChunksRef.current = []

        const extension = blobType.split("/").pop() || "webm"
        try {
          await processAudioFile(audioBlob, `recording.${extension}`)
        } finally {
          if (audioSourceNodeRef.current) {
            try {
              audioSourceNodeRef.current.disconnect()
            } catch (e) {
            }
            audioSourceNodeRef.current = null
          }
          if (audioContextRef.current) {
            try {
              audioContextRef.current.close()
            } catch (e) {
            }
            audioContextRef.current = null
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop())
            streamRef.current = null
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 50))
      try {
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.start()
        } else {
          throw new Error(`MediaRecorder is in unexpected state: ${mediaRecorder.state}`)
        }
      } catch (startError) {
        console.error("Failed to start MediaRecorder:", startError)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
        throw new Error(
          `Failed to start recording: ${startError instanceof Error ? startError.message : "Unknown error"}. Please try again.`
        )
      }

      setState("recording")
      setTimer(0)
      setWaveformData(new Array(40).fill(0))

      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)

      const analyzeAudio = () => {
        if (!analyserRef.current || !mediaRecorderRef.current) {
          return
        }

        if (mediaRecorderRef.current.state !== "recording") {
          return
        }

        const analyser = analyserRef.current
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteFrequencyData(dataArray)

        const barCount = 40
        const step = Math.floor(bufferLength / barCount)
        const waveform: number[] = []

        for (let i = 0; i < barCount; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j] || 0
          }
          const normalized = Math.max(5, Math.min(100, (sum / step / 255) * 100))
          waveform.push(normalized)
        }

        setWaveformData(waveform)
        animationFrameRef.current = requestAnimationFrame(analyzeAudio)
      }

      analyzeAudio()
    } catch (err) {
      console.error("Recording error:", err)
      let errorMessage = "Failed to start recording. Please try again."
   
      const hasStream = streamRef.current !== null
   
      if (err instanceof Error) {
        if (err.name === "NotFoundError" || err.message.includes("not found")) {
          if (hasStream) {
            errorMessage = "Browser recording feature not available. This may be a browser compatibility issue. Please try refreshing the page or using a different browser."
          } else {
            errorMessage = "Microphone not found. Please ensure a microphone is connected and try again."
          }
        } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "Microphone permission denied. Please click the lock icon (🔒) in your browser's address bar, allow microphone access, then refresh the page and try again."
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Microphone is already in use by another application. Please close other applications using the microphone and try again."
        } else if (err.message.includes("MediaRecorder")) {
          errorMessage = `Recording initialization failed: ${err.message}. This may be a browser compatibility issue.`
        } else if (err.message.includes("secure connection") || err.message.includes("HTTPS")) {
          errorMessage = err.message
        } else {
          errorMessage = err.message || errorMessage
        }
      }
   
      setError(errorMessage)
      setState("error")
   
      if (audioSourceNodeRef.current) {
        try {
          audioSourceNodeRef.current.disconnect()
        } catch (e) {
        }
        audioSourceNodeRef.current = null
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close()
        } catch (e) {
        }
        audioContextRef.current = null
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop()
      setState("processing")

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      setWaveformData(new Array(40).fill(0))
    }
  }

  const handleUploadClick = () => {
    if (state === "recording" || state === "processing") {
      return
    }
    setError(null)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ""
    await processAudioFile(file, file.name || "upload.mp3")
  }

  const reset = () => {
    setState("idle")
    setTimer(0)
    setWaveformData([])
    setError(null)
    setProcessingStatus("transcribing")
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }

  const getStatusText = () => {
    switch (state) {
      case "idle":
        return "> ready."
      case "recording":
        return `> listening... ${formatTime(timer)}`
      case "processing":
        switch (processingStatus) {
          case "transcribing":
            return "> transcribing..."
          case "structuring":
            return "> structuring with AI..."
          case "done":
            return "> done."
          default:
            return "> transcribing..."
        }
      case "done":
        return "> done."
      case "error":
        return `> error: ${error}`
      default:
        return "> ready."
    }
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 space-y-8">
      <div className="font-mono text-sm text-white text-center">
        {getStatusText()}
      </div>

      <div className="font-mono text-xs text-white py-8 w-full max-w-4xl px-4">
        {state === "recording" ? (
          <div className="flex justify-center overflow-x-auto">
            <pre className="whitespace-pre leading-tight mx-auto" style={{ fontFamily: "monospace" }}>
              {waveformData.length > 0 ? (
                generateASCIIWaveform(waveformData, isMobile)
              ) : (
                <span className="text-muted-foreground opacity-30">
                  {isMobile ? "─".repeat(30) : "─".repeat(40)}
                </span>
              )}
            </pre>
          </div>
        ) : state === "processing" ? (
          <ProcessingAnimation animationFrame={animationFrame} isMobile={isMobile} />
        ) : state === "done" ? (
          <div className="flex flex-col items-center">
            <div className="text-white font-mono text-sm mb-2">
              <span>&gt;</span> transcribing complete
            </div>
            <div className="text-muted-foreground font-mono text-xs">
              navigating to note...
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground opacity-30 flex justify-center">
            <pre className="whitespace-pre leading-tight mx-auto" style={{ fontFamily: "monospace" }}>
              {Array.from({ length: 3 }).map(() =>
                (isMobile ? "─".repeat(30) : "─".repeat(40))
              ).join("\n")}
            </pre>
          </div>
        )}
      </div>

      {state === "error" && error && (
        <div className="border border-border p-4 font-mono text-sm text-muted-foreground max-w-md text-center">
          <span>&gt;</span> {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {state === "idle" && (
          <>
            <Button
              onClick={startRecording}
              className="bg-white text-black hover:bg-muted hover:text-white font-mono font-bold rounded-none border border-border px-8 py-4 text-lg w-full max-w-xs"
            >
              <span>&gt;</span> start recording
            </Button>
            <Button
              onClick={handleUploadClick}
              className="bg-white text-black hover:bg-muted hover:text-white font-mono font-bold rounded-none border border-border px-8 py-4 text-lg w-full max-w-xs"
            >
              <span>&gt;</span> upload file
            </Button>
          </>
        )}

        {state === "recording" && (
          <Button
            onClick={stopRecording}
            className="bg-white text-black hover:bg-muted hover:text-white font-mono font-bold rounded-none border border-border px-8 py-4 text-lg w-full max-w-xs"
          >
            <span>&gt;</span> stop & transcribe
          </Button>
        )}

        {state === "error" && (
          <Button
            onClick={reset}
            className="bg-white text-black hover:bg-muted hover:text-white font-mono font-bold rounded-none border border-border px-8 py-4 text-lg w-full max-w-xs"
          >
            <span>&gt;</span> reset
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

