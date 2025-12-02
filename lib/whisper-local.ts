import { AutomaticSpeechRecognitionPipeline, pipeline } from "@xenova/transformers"
import { readFile, unlink, writeFile } from "node:fs/promises"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { WaveFile } from "wavefile"

const require = createRequire(import.meta.url)

let transcriber: AutomaticSpeechRecognitionPipeline | null = null

const getTranscriber = async () => {
  if (!transcriber) transcriber = await pipeline("automatic-speech-recognition", "Xenova/whisper-small") as AutomaticSpeechRecognitionPipeline
  return transcriber
}

const getFfmpeg = async () => {
  const ffmpeg = (await import("fluent-ffmpeg")).default
  const ffmpegPath = require("ffmpeg-static")
  if (ffmpegPath && typeof ffmpegPath === "string") {
    const { existsSync } = await import("node:fs")
    const resolvedPath = resolve(ffmpegPath)
    if (existsSync(resolvedPath)) {
      ffmpeg.setFfmpegPath(resolvedPath)
    } else {
      throw new Error(`FFmpeg binary not found at: ${resolvedPath}`)
    }
  } else {
    throw new Error("FFmpeg path not available from ffmpeg-static")
  }
  return ffmpeg
}

const convertToWav = async (inputBuffer: Buffer, inputPath: string, outputPath: string): Promise<Buffer> => {
  const ffmpeg = await getFfmpeg()
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .toFormat('wav')
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .on('end', async () => {
        try {
          const wavBuffer = await readFile(outputPath)
          await unlink(inputPath).catch(() => {})
          await unlink(outputPath).catch(() => {})
          resolve(wavBuffer)
        } catch (error) {
          reject(error)
        }
      })
      .on('error', (error) => {
        reject(new Error(`FFmpeg conversion failed: ${error.message}`))
      })
      .save(outputPath)
  })
}

const decodeAudio = async (buffer: Buffer, mimeType?: string): Promise<{
  samples: Float32Array
  sampleRate: number
  numberOfChannels: number
}> => {
  const isWav = mimeType?.includes('wav') || buffer.slice(0, 4).toString('ascii') === 'RIFF'
  
  let wavBuffer: Buffer
  
  if (isWav) {
    wavBuffer = buffer
  } else {
    const tempDir = tmpdir()
    const inputPath = join(tempDir, `input-${Date.now()}.${mimeType?.split('/')[1]?.split(';')[0] || 'mp3'}`)
    const outputPath = join(tempDir, `output-${Date.now()}.wav`)
    
    await writeFile(inputPath, buffer)
    wavBuffer = await convertToWav(buffer, inputPath, outputPath)
  }
  
  const wav = new WaveFile(wavBuffer)
  wav.toBitDepth('32f')
  wav.toSampleRate(16000) 
  
  const samples = new Float32Array(wav.getSamples(false, Float32Array) as ArrayLike<number>)
  const sampleRate = wav.fmt.sampleRate
  const numberOfChannels = wav.fmt.numChannels
  
  return { samples, sampleRate, numberOfChannels }
}

export const transcribeAudioLocal = async (
  audioFile: File | Blob,
  language: "ru" | "en" | null = null
): Promise<string> => {
  try {
    const transcriber = await getTranscriber()
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const { samples: decodedSamples, sampleRate, numberOfChannels } = await decodeAudio(buffer, audioFile.type)
    
    let samples: Float32Array
    if (numberOfChannels === 1) samples = decodedSamples
    else {
      const channelLength = decodedSamples.length / numberOfChannels
      samples = new Float32Array(channelLength)
      for (let i = 0; i < channelLength; i++) {
        let sum = 0
        for (let ch = 0; ch < numberOfChannels; ch++) {
          sum += decodedSamples[i * numberOfChannels + ch]
        }
        samples[i] = sum / numberOfChannels
      }
    }
    
    let resampledSamples = samples
    if (sampleRate !== 16000) {
      const ratio = sampleRate / 16000
      const newLength = Math.round(samples.length / ratio)
      resampledSamples = new Float32Array(newLength)
      for (let i = 0; i < newLength; i++) {
        const srcIndex = Math.round(i * ratio)
        resampledSamples[i] = samples[srcIndex]
      }
    }

    const options: any = {
      return_timestamps: false,
      chunk_length_s: 30,
    }

    if (language) options.language = language
    
    const result = await transcriber(resampledSamples, options)
    const transcript = result?.text || ""
    
    if (!transcript) throw new Error("Whisper returned empty transcript")
    
    return transcript.trim()
  } catch (error) {
    throw new Error(
          `Local transcription failed: ${error instanceof Error ? error.message : "Unknown error"}`
        )
  }
}

export const cleanUpTranscriber = () => transcriber = null
