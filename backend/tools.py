"""
PixelCut agent tools. Wraps video-cli (trim, remove, mute, retime) and video-text overlay.
All tools operate on video file paths; use inplace=True to overwrite the file.
Transcript helpers: load transcript JSON and find segments by spoken text for trim/remove/mute.
"""

import json
import os
import shutil
import subprocess
import sys

# Use video_cli from installed wheel (pip install backend/tools/video_cli-*.whl)
# or from source only if backend/tools/video-cli/ exists (so we don't shadow the wheel)
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
_VIDEO_CLI_SOURCE = os.path.join(_BACKEND_DIR, "tools", "video-cli")
if os.path.isdir(_VIDEO_CLI_SOURCE) and _VIDEO_CLI_SOURCE not in sys.path:
    sys.path.insert(0, _VIDEO_CLI_SOURCE)

try:
    from video_cli.cli.trim import clip as trim_clip
    from video_cli.cli.remove import remove_segment as remove_segment_cli
    from video_cli.cli.mute import mute as mute_cli
    from video_cli.cli.retime import retime as retime_cli
except ModuleNotFoundError as e:
    raise ModuleNotFoundError(
        "video_cli not found. Install the wheel: pip install backend/tools/video_cli-*.whl"
    ) from e

def run_trim_video(file_path: str, start: float, end: float, inplace: bool = True) -> dict:
    """Trim video to [start, end] seconds. Like: video-trim FILE --start 5 --end 10 --inplace."""
    try:
        trim_clip(in_file=file_path, start=start, end=end, inplace=inplace)
        return {"ok": True, "message": "Trimmed", "file_path": file_path, "start": start, "end": end}
    except Exception as e:
        return {"ok": False, "message": str(e), "file_path": file_path}


def run_remove_segment(file_path: str, start: float, end: float, inplace: bool = True) -> dict:
    """Remove segment [start, end] from video. Like: video-remove FILE --start 5 --end 10 --inplace."""
    try:
        remove_segment_cli(in_file=file_path, start=start, end=end, inplace=inplace)
        return {"ok": True, "message": "Segment removed", "file_path": file_path, "start": start, "end": end}
    except Exception as e:
        return {"ok": False, "message": str(e), "file_path": file_path}


def run_mute_segment(file_path: str, start: float, end: float, inplace: bool = True) -> dict:
    """Mute audio between start and end seconds. Like: video-mute FILE --start 5 --end 10 --inplace."""
    try:
        mute_cli(in_file=file_path, start=start, end=end, inplace=inplace)
        return {"ok": True, "message": "Segment muted", "file_path": file_path, "start": start, "end": end}
    except Exception as e:
        return {"ok": False, "message": str(e), "file_path": file_path}


def run_retime(file_path: str, factor: float, inplace: bool = True) -> dict:
    """Change playback speed by factor (e.g. 2 = 2x faster). Like: video-retime FILE --factor 2 --inplace."""
    try:
        retime_cli(in_file=file_path, retime=factor, inplace=inplace)
        return {"ok": True, "message": "Retimed", "file_path": file_path, "factor": factor}
    except Exception as e:
        return {"ok": False, "message": str(e), "file_path": file_path}


def run_add_text_overlay(
    file_path: str, text: str, start: float, end: float, y: float = 0.8, inplace: bool = True
) -> dict:
    """Add text overlay from start to end seconds; y is vertical position 0–1 (e.g. 0.8 = 80% down).
    Like: video-text FILE --text \"...\" --start 2 --end 10 --y 0.8.
    """
    stem, ext = os.path.splitext(file_path)
    out_file = stem + "_text" + ext
    # Escape single quotes in text for ffmpeg drawtext
    escaped = text.replace("\\", "\\\\").replace("'", "\\'")
    # drawtext: show text between t=start and t=end; y=h*Y
    vf = (
        f"drawtext=text='{escaped}':enable='between(t\\,{start}\\,{end})':"
        f"x=(w-text_w)/2:y=h*{y}-text_h:fontsize=24:fontcolor=white"
    )
    cmd = [
        "ffmpeg", "-y", "-i", file_path,
        "-vf", vf,
        "-c:a", "copy",
        "-movflags", "+faststart",
        out_file,
    ]
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        if inplace and os.path.exists(out_file):
            shutil.move(out_file, file_path)
        return {
            "ok": True,
            "message": "Text overlay added",
            "file_path": file_path,
            "text": text,
            "start": start,
            "end": end,
            "y": y,
        }
    except subprocess.CalledProcessError as e:
        err = (e.stderr or e.stdout or b"").decode(errors="replace") if (e.stderr or e.stdout) else str(e)
        return {"ok": False, "message": err, "file_path": file_path}
    except Exception as e:
        return {"ok": False, "message": str(e), "file_path": file_path}


# ----- Transcript helpers (for agent context: find start/end from spoken text) -----

def load_transcript(transcript_path: str) -> dict | None:
    """Load transcript JSON from file. Format: { segments: [ { start, end, speech?, action? }, ... ] }."""
    if not transcript_path or not os.path.isfile(transcript_path):
        return None
    try:
        with open(transcript_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return None


def find_segments_by_speech(transcript: dict, text: str) -> list[dict]:
    """
    Find segments whose 'speech' contains the given text (case-insensitive, stripped).
    Returns list of segment dicts with start, end, speech, action.
    Used when user says e.g. \"trim 'Saad up here. Hi Saad'\" to get start/end from transcript.
    """
    segments = transcript.get("segments") or []
    text_clean = (text or "").strip().lower()
    if not text_clean:
        return []
    out = []
    for seg in segments:
        speech = (seg.get("speech") or "").strip()
        if text_clean in speech.lower():
            out.append(seg)
    return out
