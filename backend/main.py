from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import sys
import os
import uuid
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root (parent of backend)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

# Add parent directory to path to import database module
# Try multiple paths for Docker compatibility
_backend_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.dirname(_backend_dir)
sys.path.append(_project_root)
# Also try /root/project for Docker
if os.path.exists("/root/project/database"):
    sys.path.append("/root/project")
from database.db_connection import DatabaseConnection

# Import tools and agent (run from backend dir so tools.py and tools/video-cli are available)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)
from tools import (
    run_trim_video,
    run_remove_segment,
    run_mute_segment,
    run_retime,
    run_add_text_overlay,
    load_transcript,
)
from agent import PixelCutAgent

app = FastAPI()

# CORS: Allow specific origins (cannot use "*" with allow_credentials=True)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://drafft.tech",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.get("/download/{video_id}")
async def download_video(video_id: int):
    """Download the video file by video ID. Returns the file for download."""
    with DatabaseConnection() as db:
        video = db.get_video_by_id(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        file_path = video.get("file_path")
        filename = video.get("filename") or Path(file_path).name
    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="video/mp4",
    )


@app.post("/upload")
async def upload_video(
    request: Request,
    video: UploadFile = File(...),
    transcript_file: UploadFile = File(None),
    transcript: str = Form(None),
    transcript_json: str = Form(None),
):
    """
    Upload a video file (required) and optional transcript on the same endpoint.
    Use form-data with:
    - video: file (required)
    - transcript or transcript_json: paste the JSON string (key "transcript" or "transcript_json"), or
    - transcript_file: upload a .json file (key "transcript_file").
    Returns the video ID and transcript_path if transcript was provided.
    """
    def _to_str(v):
        if v is None or v == "":
            return ""
        return str(v).strip()

    transcript_str = _to_str(transcript) or _to_str(transcript_json) or ""
    if not transcript_str:
        try:
            form = await request.form()
            for key in ("transcript", "transcript_json"):
                v = form.get(key)
                if v is not None and not getattr(v, "filename", None):
                    transcript_str = _to_str(v).strip()
                    if transcript_str:
                        break
        except Exception:
            pass

    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")

    file_extension = Path(video.filename).suffix if video.filename else ".mp4"
    unique_id = str(uuid.uuid4())
    unique_filename = f"{unique_id}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    transcript_path_str = None
    if transcript_file and transcript_file.filename:
        transcript_ext = Path(transcript_file.filename).suffix.lower()
        if transcript_ext != ".json":
            raise HTTPException(
                status_code=400,
                detail="Transcript file must be a .json file (segments with start, end, speech).",
            )
        transcript_filename = f"{unique_id}_transcript.json"
        transcript_path = UPLOAD_DIR / transcript_filename
        try:
            transcript_content = await transcript_file.read()
            with open(transcript_path, "wb") as buffer:
                buffer.write(transcript_content)
            transcript_path_str = str(transcript_path.absolute())
        except Exception as e:
            if file_path.exists():
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Error saving transcript: {str(e)}")
    elif transcript_str:
        transcript_filename = f"{unique_id}_transcript.json"
        transcript_path = UPLOAD_DIR / transcript_filename
        try:
            with open(transcript_path, "w", encoding="utf-8") as f:
                f.write(transcript_str)
            transcript_path_str = str(transcript_path.absolute())
        except Exception as e:
            if file_path.exists():
                os.remove(file_path)
            raise HTTPException(status_code=400, detail=f"Invalid transcript JSON: {str(e)}")

    try:
        with open(file_path, "wb") as buffer:
            content = await video.read()
            buffer.write(content)

        file_size = len(content)
        file_path_str = str(file_path.absolute())
        file_url = f"/uploads/{unique_filename}"

        with DatabaseConnection() as db:
            video_id = db.insert_video(
                filename=video.filename or unique_filename,
                file_path=file_path_str,
                file_url=file_url,
                file_size=file_size,
                duration=None,
                transcript_path=transcript_path_str,
            )

            if not video_id:
                os.remove(file_path)
                if transcript_path_str and os.path.isfile(transcript_path_str):
                    os.remove(transcript_path_str)
                raise HTTPException(
                    status_code=503,
                    detail="Database unavailable. Make sure MySQL is running and DB_HOST, DB_NAME, DB_USER, DB_PASSWORD are set correctly.",
                )

            return {
                "message": "Video uploaded successfully",
                "video_id": video_id,
                "filename": video.filename,
                "file_url": file_url,
                "transcript_path": transcript_path_str,
            }
    except Exception as e:
        if file_path.exists():
            os.remove(file_path)
        if transcript_path_str and os.path.isfile(transcript_path_str):
            os.remove(transcript_path_str)
        err_msg = str(e).strip() or getattr(e, "msg", "") or type(e).__name__
        raise HTTPException(status_code=500, detail=f"Error uploading video: {err_msg}")


class TranscriptBody(BaseModel):
    """Transcript JSON: segments with start, end, speech, action."""
    segments: list


@app.post("/videos/{video_id}/transcript")
async def set_video_transcript(video_id: int, body: TranscriptBody):
    """
    Attach or replace transcript for an existing video (JSON body).
    Use this if transcript did not save during upload. Body: { "segments": [ { "start", "end", "speech", "action" }, ... ] }.
    """
    import json as _json
    with DatabaseConnection() as db:
        video = db.get_video_by_id(video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        file_path_str = video.get("file_path")
    if not file_path_str or not os.path.isfile(file_path_str):
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    try:
        uid = str(uuid.uuid4())
        transcript_filename = f"{uid}_transcript.json"
        transcript_path = UPLOAD_DIR / transcript_filename
        with open(transcript_path, "w", encoding="utf-8") as f:
            _json.dump(body.model_dump(), f, indent=2)
        transcript_path_str = str(transcript_path.absolute())
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid transcript: {str(e)}")

    with DatabaseConnection() as db:
        if not db.update_video_transcript(video_id, transcript_path_str):
            if transcript_path_str and os.path.isfile(transcript_path_str):
                os.remove(transcript_path_str)
            raise HTTPException(status_code=500, detail="Failed to update transcript in database")
    return {"message": "Transcript saved", "video_id": video_id, "transcript_path": transcript_path_str}


class ChatRequest(BaseModel):
    video_id: int
    message: str


@app.post("/chat")
async def chat_with_agent(request: ChatRequest):
    """
    Chat with the PixelCut agent for the given video.
    The agent has access to the video's transcript (if uploaded) and uses it to resolve
    spoken text to start/end times. E.g. user: "Can you trim 'Saad up here. Hi Saad'"
    -> agent finds segment with that speech (start=1, end=3) and calls trim_video.
    If the user specifies start/end times explicitly, the agent uses those.
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        file_path = video.get("file_path")
        transcript_path = video.get("transcript_path")
    if not file_path or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Video file not found on disk")

    transcript = load_transcript(transcript_path) if transcript_path else None
    agent = PixelCutAgent()
    try:
        response_text = agent.invoke(
            user_message=request.message,
            file_path=file_path,
            transcript=transcript,
        )
        return {"response": response_text, "video_id": request.video_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


class TrimVideoRequest(BaseModel):
    video_id: int
    start: float
    end: float


@app.post("/trim_video")
async def trim_video(request: TrimVideoRequest):
    """
    Trim video from start to end time.
    Parameters:
    - video_id: ID of the video in the database
    - start: Start time in seconds
    - end: End time in seconds
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "message": "Video trim request received",
            "video_id": request.video_id,
            "video_path": video.get('file_path'),
            "video_url": video.get('file_url'),
            "start": request.start,
            "end": request.end
        }


class RemoveSegmentRequest(BaseModel):
    video_id: int
    start: float
    end: float


@app.post("/remove_segment")
async def remove_segment(request: RemoveSegmentRequest):
    """
    Remove a segment from the video.
    Parameters:
    - video_id: ID of the video in the database
    - start: Start time of segment to remove (in seconds)
    - end: End time of segment to remove (in seconds)
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "message": "Segment removal request received",
            "video_id": request.video_id,
            "video_path": video.get('file_path'),
            "video_url": video.get('file_url'),
            "start": request.start,
            "end": request.end
        }


class MuteSegmentRequest(BaseModel):
    video_id: int
    start: float
    end: float


@app.post("/mute_segment")
async def mute_segment(request: MuteSegmentRequest):
    """
    Mute audio in a specific segment of the video.
    Parameters:
    - video_id: ID of the video in the database
    - start: Start time of segment to mute (in seconds)
    - end: End time of segment to mute (in seconds)
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "message": "Segment mute request received",
            "video_id": request.video_id,
            "video_path": video.get('file_path'),
            "video_url": video.get('file_url'),
            "start": request.start,
            "end": request.end
        }


class ChangeSpeedRequest(BaseModel):
    video_id: int
    speed: float
    start: float


@app.post("/change_speed")
async def change_speed(request: ChangeSpeedRequest):
    """
    Change the playback speed of the video.
    Parameters:
    - video_id: ID of the video in the database
    - speed: Speed multiplier (e.g., 0.5 for half speed, 2.0 for double speed)
    - start: Start time to apply speed change (in seconds)
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "message": "Speed change request received",
            "video_id": request.video_id,
            "video_path": video.get('file_path'),
            "video_url": video.get('file_url'),
            "speed": request.speed,
            "start": request.start
        }


class AddTextOverlayRequest(BaseModel):
    video_id: int
    text: str
    position: str
    start_time: float


@app.post("/add_text_overlay")
async def add_text_overlay(request: AddTextOverlayRequest):
    """
    Add text overlay to the video.
    Parameters:
    - video_id: ID of the video in the database
    - text: Text to overlay
    - position: Position of text (e.g., "top-left", "center", "bottom-right", or coordinates)
    - start_time: Start time for when text appears (in seconds)
    """
    with DatabaseConnection() as db:
        video = db.get_video_by_id(request.video_id)
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "message": "Text overlay request received",
            "video_id": request.video_id,
            "video_path": video.get('file_path'),
            "video_url": video.get('file_url'),
            "text": request.text,
            "position": request.position,
            "start_time": request.start_time
        }


# ----- Tools API (video-cli) for Postman testing -----
# Use file_path (path on server) OR video_id (looked up from DB). Times in seconds.
# After each edit, the video record in the DB is updated (file_size).

def _resolve_file_path(file_path: str | None, video_id: int | None) -> str:
    """Resolve file path from file_path or video_id (DB lookup)."""
    if file_path:
        return file_path
    if video_id is not None:
        with DatabaseConnection() as db:
            video = db.get_video_by_id(video_id)
            if not video:
                raise HTTPException(status_code=404, detail="Video not found")
            return video["file_path"]
    raise HTTPException(status_code=400, detail="Provide file_path or video_id")


def _get_video_id_for_update(request_video_id: int | None, file_path: str) -> int | None:
    """Resolve video_id for DB update: from request or by looking up file_path in DB."""
    if request_video_id is not None:
        return request_video_id
    with DatabaseConnection() as db:
        video = db.get_video_by_file_path(file_path)
        return video["id"] if video else None


def _update_db_after_edit(request_video_id: int | None, file_path: str, result: dict) -> None:
    """If the tool succeeded, update the video record in the DB (e.g. file_size)."""
    if not result.get("ok"):
        return
    video_id = _get_video_id_for_update(request_video_id, file_path)
    if video_id is None:
        return
    with DatabaseConnection() as db:
        db.update_video_after_edit(video_id, file_path)


class ToolTrimRequest(BaseModel):
    file_path: str | None = None
    video_id: int | None = None
    start: float
    end: float
    inplace: bool = True


@app.post("/tools/trim")
async def api_trim(request: ToolTrimRequest):
    """Trim video to [start, end] seconds. Like: video-trim FILE --start 5 --end 10 --inplace."""
    path = _resolve_file_path(request.file_path, request.video_id)
    result = run_trim_video(file_path=path, start=request.start, end=request.end, inplace=request.inplace)
    _update_db_after_edit(request.video_id, path, result)
    return result


class ToolRemoveRequest(BaseModel):
    file_path: str | None = None
    video_id: int | None = None
    start: float
    end: float
    inplace: bool = True


@app.post("/tools/remove_segment")
async def api_remove_segment(request: ToolRemoveRequest):
    """Remove segment [start, end] from video. Like: video-remove FILE --start 5 --end 10 --inplace."""
    path = _resolve_file_path(request.file_path, request.video_id)
    result = run_remove_segment(file_path=path, start=request.start, end=request.end, inplace=request.inplace)
    _update_db_after_edit(request.video_id, path, result)
    return result


class ToolMuteRequest(BaseModel):
    file_path: str | None = None
    video_id: int | None = None
    start: float
    end: float
    inplace: bool = True


@app.post("/tools/mute_segment")
async def api_mute_segment(request: ToolMuteRequest):
    """Mute audio between start and end seconds. Like: video-mute FILE --start 5 --end 10 --inplace."""
    path = _resolve_file_path(request.file_path, request.video_id)
    result = run_mute_segment(file_path=path, start=request.start, end=request.end, inplace=request.inplace)
    _update_db_after_edit(request.video_id, path, result)
    return result


class ToolRetimeRequest(BaseModel):
    file_path: str | None = None
    video_id: int | None = None
    factor: float
    inplace: bool = True


@app.post("/tools/retime")
async def api_retime(request: ToolRetimeRequest):
    """Change playback speed by factor (e.g. 2 = 2x faster). Like: video-retime FILE --factor 2 --inplace."""
    path = _resolve_file_path(request.file_path, request.video_id)
    result = run_retime(file_path=path, factor=request.factor, inplace=request.inplace)
    _update_db_after_edit(request.video_id, path, result)
    return result


class ToolTextOverlayRequest(BaseModel):
    file_path: str | None = None
    video_id: int | None = None
    text: str
    start: float
    end: float
    y: float = 0.8
    inplace: bool = True


@app.post("/tools/add_text_overlay")
async def api_add_text_overlay(request: ToolTextOverlayRequest):
    """Add text overlay from start to end seconds; y = vertical position 0–1. Like: video-text FILE --text \"...\" --start 2 --end 10 --y 0.8."""
    path = _resolve_file_path(request.file_path, request.video_id)
    result = run_add_text_overlay(
        file_path=path,
        text=request.text,
        start=request.start,
        end=request.end,
        y=request.y,
        inplace=request.inplace,
    )
    _update_db_after_edit(request.video_id, path, result)
    return result
