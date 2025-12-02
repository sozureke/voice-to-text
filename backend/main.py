import os
import tempfile
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import httpx
import whisper
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

whisper_model = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global whisper_model
    model_size = os.getenv("WHISPER_MODEL_SIZE", "base")
    print(f"Loading Whisper model: {model_size}")
    whisper_model = whisper.load_model(model_size)
    print("Whisper model loaded successfully")
    yield
    whisper_model = None


app = FastAPI(title="Voice-to-Text Transcription API", lifespan=lifespan)
cors_origins = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else []
if not cors_origins or cors_origins == [""]:
    cors_origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]
    nextauth_url = os.getenv("NEXTAUTH_URL")
    if nextauth_url and nextauth_url not in cors_origins:
        cors_origins.append(nextauth_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptionResponse(BaseModel):
    transcript: str


class SummaryResponse(BaseModel):
    summary: str


class StructureResponse(BaseModel):
    structured_content: str


class ProcessAudioResponse(BaseModel):
    transcript: str
    summary: str
    structured_content: str


OPENROUTER_API_URL = "https://openrouter.ai/api/v1"


def get_openrouter_api_key() -> str:
    key = os.getenv("OPENROUTER_API_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not configured in backend environment"
        )
    return key

async def call_openrouter(
    prompt: str,
    system_prompt: str,
    model: str = "openai/gpt-4o-mini",
    max_tokens: int = 2000,
    temperature: float = 0.7,
) -> str:
    api_key = get_openrouter_api_key()
    nextauth_url = os.getenv("NEXTAUTH_URL", "http://localhost:3000")
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{OPENROUTER_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": nextauth_url,
                "X-Title": "AI Voice-to-Notes",
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt},
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            },
        )
        
        if not response.is_success:
            error_text = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OpenRouter API error: {error_text}"
            )
        
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        if not content:
            raise HTTPException(
                status_code=500,
                detail="OpenRouter returned empty response"
            )
        
        return content


@app.get("/health")
async def health_check():
    return {"status": "ok", "model_loaded": whisper_model is not None}


@app.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = None,
):
    if whisper_model is None:
        raise HTTPException(
            status_code=503, detail="Whisper model not loaded. Please wait for startup."
        )

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400, detail="File must be an audio file"
        )

    suffix = ""
    if audio.filename:
        suffix = Path(audio.filename).suffix
    if not suffix and audio.content_type:
        content_type_map = {
            "audio/mpeg": ".mp3",
            "audio/wav": ".wav",
            "audio/webm": ".webm",
            "audio/ogg": ".ogg",
            "audio/mp4": ".m4a",
        }
        suffix = content_type_map.get(audio.content_type, "")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        try:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

            options = {
                "fp16": False,
            }
            
            if language:
                options["language"] = language

            try:
                result = whisper_model.transcribe(tmp_file_path, **options)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Whisper transcription failed: {str(e)}"
                )
            
            transcript = result.get("text", "").strip()

            if not transcript:
                raise HTTPException(
                    status_code=500, detail="Whisper returned empty transcript"
                )

            return TranscriptionResponse(transcript=transcript)

        finally:
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass


@app.post("/summary", response_model=SummaryResponse)
async def generate_summary(
    transcript: str,
    model: str = "openai/gpt-4o-mini",
):
    prompt = f"Please provide a brief 2-3 sentence summary of the following transcript. Focus on the main ideas and key points:\n\n{transcript}"
    system_prompt = "You are a helpful assistant that creates concise summaries of voice transcripts."
    
    summary = await call_openrouter(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        max_tokens=150,
        temperature=0.7,
    )
    
    return SummaryResponse(summary=summary)


@app.post("/structure", response_model=StructureResponse)
async def structure_transcript(
    transcript: str,
    summary: Optional[str] = None,
    model: str = "openai/gpt-4o-mini",
):
    prompt = f"""Transform the following voice transcript into a well-structured markdown document. 

Requirements:
- Organize content by topics with clear headings (##)
- Use bullet points for lists
- Use **bold** for key ideas and important points
- Maintain the original meaning and information
- Make it easy to read and scan

{f'Summary context: {summary}\n\n' if summary else ''}Transcript:\n{transcript}"""
    
    system_prompt = "You are a helpful assistant that transforms unstructured voice transcripts into well-organized markdown documents."
    
    structured_content = await call_openrouter(
        prompt=prompt,
        system_prompt=system_prompt,
        model=model,
        max_tokens=2000,
        temperature=0.7,
    )
    
    return StructureResponse(structured_content=structured_content)


@app.post("/process-audio", response_model=ProcessAudioResponse)
async def process_audio_to_note(
    audio: UploadFile = File(...),
    language: Optional[str] = None,
    model: str = "openai/gpt-4o-mini",
):
    if whisper_model is None:
        raise HTTPException(
            status_code=503, detail="Whisper model not loaded. Please wait for startup."
        )

    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=400, detail="File must be an audio file"
        )

    suffix = ""
    if audio.filename:
        suffix = Path(audio.filename).suffix
    if not suffix and audio.content_type:
        content_type_map = {
            "audio/mpeg": ".mp3",
            "audio/wav": ".wav",
            "audio/webm": ".webm",
            "audio/ogg": ".ogg",
            "audio/mp4": ".m4a",
        }
        suffix = content_type_map.get(audio.content_type, "")
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        try:
            content = await audio.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

            options = {"fp16": False}
            if language:
                options["language"] = language

            try:
                result = whisper_model.transcribe(tmp_file_path, **options)
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Whisper transcription failed: {str(e)}"
                )
            
            transcript = result.get("text", "").strip()

            if not transcript:
                raise HTTPException(
                    status_code=500, detail="Whisper returned empty transcript"
                )

        finally:
            try:
                os.unlink(tmp_file_path)
            except Exception:
                pass

    summary_prompt = f"Please provide a brief 2-3 sentence summary of the following transcript. Focus on the main ideas and key points:\n\n{transcript}"
    summary = await call_openrouter(
        prompt=summary_prompt,
        system_prompt="You are a helpful assistant that creates concise summaries of voice transcripts.",
        model=model,
        max_tokens=150,
        temperature=0.7,
    )

    structure_prompt = f"""Transform the following voice transcript into a well-structured markdown document. 

Requirements:
- Organize content by topics with clear headings (##)
- Use bullet points for lists
- Use **bold** for key ideas and important points
- Maintain the original meaning and information
- Make it easy to read and scan

Summary context: {summary}

Transcript:\n{transcript}"""
    
    structured_content = await call_openrouter(
        prompt=structure_prompt,
        system_prompt="You are a helpful assistant that transforms unstructured voice transcripts into well-organized markdown documents.",
        model=model,
        max_tokens=2000,
        temperature=0.7,
    )

    return ProcessAudioResponse(
        transcript=transcript,
        summary=summary,
        structured_content=structured_content,
    )


if __name__ == "__main__":    
    port = int(os.getenv("BACKEND_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

