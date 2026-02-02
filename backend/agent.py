"""
PixelCut agent using LangChain and Google GenAI.
Orchestrates video editing tools (video-cli: trim, remove, mute, retime, video-text) via a single conversational interface.
When a transcript is provided, the agent uses it to resolve spoken text to start/end times (e.g. trim "Saad up here. Hi Saad").

Set GOOGLE_API_KEY in .env (project root) or in the environment for Gemini API access.
"""

import json
import os
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import StructuredTool
from langchain_google_genai import ChatGoogleGenerativeAI

# Load .env from backend dir and project root so GOOGLE_API_KEY is available
_backend_dir = Path(__file__).resolve().parent
_project_root = _backend_dir.parent
load_dotenv(_backend_dir / ".env")
load_dotenv(_project_root / ".env")

from tools import (
    run_trim_video,
    run_remove_segment,
    run_mute_segment,
    run_retime,
    run_add_text_overlay,
)


SYSTEM_PROMPT = """You are PixelCut, a helpful video editing assistant. You help users edit videos through natural language.

## Tools (all take a video file path; times in seconds)
- **trim_video**: Keep only [start, end] of the video. Like: video-trim FILE --start 5 --end 10 --inplace.
- **remove_segment**: Remove the segment [start, end] from the video. Like: video-remove FILE --start 5 --end 10 --inplace.
- **mute_segment**: Mute audio between start and end. Like: video-mute FILE --start 5 --end 10 --inplace.
- **retime**: Change playback speed by factor (e.g. 2 = 2x faster). Like: video-retime FILE --factor 2 --inplace.
- **add_text_overlay**: Draw text on the video between start and end; y is vertical position 0–1 (e.g. 0.8 = 80% down). Like: video-text FILE --text "..." --start 2 --end 10 --y 0.8.

## Your role
- Understand what the user wants (trim, remove segment, mute, retime, text overlay).
- When the user references spoken text (e.g. "trim 'Saad up here. Hi Saad'" or "remove the part where they say ..."), use the transcript below to find the segment's start and end times, then call the right tool with that file_path and those times.
- If the user gives explicit start/end times in seconds, use those.
- Choose the right tool(s) and the video file path and parameters. Always use the current video file path provided below.
- Confirm actions and report results clearly.

## Rules
- Always use the correct tool; do not invent parameters.
- All times are in seconds (e.g. 30.5).
- You MUST use the current video file path provided in the context below for every tool call.
- inplace=True overwrites the file; use when the user wants to edit in place.
- After calling a tool, summarize the result. If a tool fails, explain and suggest what to do next.
- Be concise and clear. Use the tools; do not describe steps without calling them.
"""


class PixelCutAgent:
    """Agent that uses LangChain + Google GenAI and PixelCut video-cli tools."""

    def __init__(self, model: str = "gemini-3-flash-preview", **kwargs):
        # Require Gemini API key (from https://aistudio.google.com/apikey) so we don't fall back to gcloud ADC
        api_key = kwargs.get("api_key") or os.getenv("GOOGLE_API_KEY")
        if not api_key or not api_key.strip():
            raise ValueError(
                "GOOGLE_API_KEY is not set. Set it in .env or the environment with a Gemini API key from "
                "https://aistudio.google.com/apikey (do not use Google Cloud ADC for Gemini)."
            )
        kwargs["api_key"] = api_key
        # Default to gemini-1.5-flash (better free-tier quota); set GEMINI_MODEL to use gemini-2.0-flash etc.
        model = model or os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
        self.llm = ChatGoogleGenerativeAI(model=model, **kwargs)

    def _create_tools(self) -> List[StructuredTool]:
        """Create LangChain tools from our tool wrappers (video-cli + video-text)."""

        def upload_tool(file_path: str, filename: str | None = None) -> str:
            """Upload a video file. Use when the user wants to add or upload a video."""
            result = run_upload(file_path=file_path, filename=filename)
            return json.dumps(result, indent=2)

        def trim_video_tool(file_path: str, start: float, end: float, inplace: bool = True) -> str:
            """Trim video to [start, end] seconds. Like: video-trim FILE --start 5 --end 10 --inplace."""
            result = run_trim_video(file_path=file_path, start=start, end=end, inplace=inplace)
            return json.dumps(result, indent=2)

        def remove_segment_tool(file_path: str, start: float, end: float, inplace: bool = True) -> str:
            """Remove segment [start, end] from video. Like: video-remove FILE --start 5 --end 10 --inplace."""
            result = run_remove_segment(file_path=file_path, start=start, end=end, inplace=inplace)
            return json.dumps(result, indent=2)

        def mute_segment_tool(file_path: str, start: float, end: float, inplace: bool = True) -> str:
            """Mute audio between start and end seconds. Like: video-mute FILE --start 5 --end 10 --inplace."""
            result = run_mute_segment(file_path=file_path, start=start, end=end, inplace=inplace)
            return json.dumps(result, indent=2)

        def retime_tool(file_path: str, factor: float, inplace: bool = True) -> str:
            """Change playback speed by factor (e.g. 2 = 2x faster). Like: video-retime FILE --factor 2 --inplace."""
            result = run_retime(file_path=file_path, factor=factor, inplace=inplace)
            return json.dumps(result, indent=2)

        def add_text_overlay_tool(
            file_path: str, text: str, start: float, end: float, y: float = 0.8, inplace: bool = True
        ) -> str:
            """Add text overlay from start to end seconds; y is vertical position 0–1 (e.g. 0.8). Like: video-text FILE --text \"...\" --start 2 --end 10 --y 0.8."""
            result = run_add_text_overlay(
                file_path=file_path, text=text, start=start, end=end, y=y, inplace=inplace
            )
            return json.dumps(result, indent=2)

        return [
            StructuredTool.from_function(
                func=trim_video_tool,
                name="trim_video",
                description="Trim video to time range [start, end] in seconds. Input: file_path (video path), start, end, inplace (default True).",
            ),
            StructuredTool.from_function(
                func=remove_segment_tool,
                name="remove_segment",
                description="Remove segment [start, end] from video (seconds). Input: file_path, start, end, inplace (default True).",
            ),
            StructuredTool.from_function(
                func=mute_segment_tool,
                name="mute_segment",
                description="Mute audio between start and end seconds. Input: file_path, start, end, inplace (default True).",
            ),
            StructuredTool.from_function(
                func=retime_tool,
                name="retime",
                description="Change playback speed by factor (e.g. 2 = 2x faster). Input: file_path, factor (float), inplace (default True).",
            ),
            StructuredTool.from_function(
                func=add_text_overlay_tool,
                name="add_text_overlay",
                description="Add text overlay from start to end seconds; y is vertical position 0–1 (default 0.8). Input: file_path, text, start, end, y (optional), inplace (default True).",
            ),
        ]

    def get_tools(self) -> List[StructuredTool]:
        """Return the list of tools for binding to the LLM or agent."""
        return self._create_tools()

    def build_system_message(self, file_path: str, transcript: dict | None = None) -> str:
        """Build system message with current video path and optional transcript for resolving spoken text to start/end."""
        parts = [SYSTEM_PROMPT]
        parts.append("\n## Current video file path (use this for every tool call)\n")
        parts.append(file_path)
        if transcript and transcript.get("segments"):
            parts.append("\n## Video transcript (use to get start/end when user references spoken text; each segment has start, end, speech)\n")
            parts.append(json.dumps(transcript, indent=2))
        return "".join(parts)

    def invoke(self, user_message: str, file_path: str, transcript: dict | None = None, max_tool_rounds: int = 10) -> str:
        """
        Run the agent: user message + optional transcript and file_path.
        Resolves spoken text to start/end from transcript when user says e.g. "trim 'Saad up here. Hi Saad'".
        Returns the final assistant text response.
        """
        system_content = self.build_system_message(file_path=file_path, transcript=transcript)
        tools = self.get_tools()
        tool_map = {t.name: t for t in tools}
        llm_with_tools = self.llm.bind_tools(tools)

        messages = [
            SystemMessage(content=system_content),
            HumanMessage(content=user_message),
        ]
        for _ in range(max_tool_rounds):
            response = llm_with_tools.invoke(messages)
            if not getattr(response, "tool_calls", None):
                return response.content or ""
            messages.append(AIMessage(content=response.content or "", tool_calls=response.tool_calls))
            for tc in response.tool_calls:
                name = tc.get("name")
                args = tc.get("args") or {}
                tool = tool_map.get(name)
                if not tool:
                    result = json.dumps({"error": f"Unknown tool: {name}"})
                else:
                    try:
                        result = tool.invoke(args)
                    except Exception as e:
                        result = json.dumps({"error": str(e)})
                messages.append(ToolMessage(content=result, tool_call_id=tc.get("id", "")))
        return response.content or ""
