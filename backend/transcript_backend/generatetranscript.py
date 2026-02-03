import os
import time
import json
import logging
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

# --- PATH LOGIC: Looking for .env in the root folder ---
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))
env_path = os.path.join(root_dir, ".env")
load_dotenv(dotenv_path=env_path)

# --- LOGGING SETUP ---
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("PixelCut_AI")

# --- INITIALIZE GEMINI ---
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print(f"❌ Error: .env not found at {env_path} or GEMINI_API_KEY is empty.")
else:
    print(f"✅ .env loaded from: {env_path}")

client = genai.Client(api_key=api_key)

# --- FASTAPI SETUP ---
app = FastAPI()

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

@app.get("/")
async def root():
    return {"message": "Hello World from transcript backend"}

@app.post("/generate-transcript")
async def generate_transcript(video: UploadFile = File(...)):
    # 1. Save video locally for Gemini upload
    temp_filename = f"temp_{int(time.time())}_{video.filename}"
    temp_path = os.path.join(script_dir, temp_filename)
    
    try:
        logger.info(f"🚀 Received video: {video.filename}. Saving temporarily...")
        with open(temp_path, "wb") as f:
            f.write(await video.read())

        # 2. Upload to Gemini File API
        logger.info("📤 Uploading to Gemini Cloud...")
        video_file = client.files.upload(file=temp_path)

        while video_file.state == "PROCESSING":
            time.sleep(2)
            video_file = client.files.get(name=video_file.name)
        
        logger.info("🧠 Video processed. Generating Dual-Track Transcript...")

        # 3. The Prompt (Enforcing your specific constraints)
        surgical_prompt = """
        Analyze this video and return a JSON 'Master Transcript'.
            
        STRICT RULES:
        1. DYNAMIC SEGMENTING: Create a new segment whenever the action changes OR the speaker pauses.
        2. 1-SECOND SILENCE RULE: If there is at least 1 second of no speaking, you MUST create a 
        dedicated segment for that gap. Set speech to "". Do NOT label it 'silence' in the 
        text; just leave it empty.
        3. MAX DURATION: No segment can exceed 5 seconds.
        4. DUAL-TRACK: Every segment MUST have:
        - 'start' & 'end': Integer seconds.
        - 'action': Describe the visual (e.g., "Looking at camera", "Typing", "Still").
        - 'speech': Verbatim text. Use "" for any segment where no one is talking.
        
        JSON Structure:
        {
        "segments": [
            {"start": 0, "end": 4, "action": "Intro logo", "speech": ""},
            {"start": 4, "end": 5, "action": "Host prepares to speak", "speech": ""},
            {"start": 5, "end": 10, "action": "Host speaking", "speech": "Welcome to the hackathon!"}
        ]
        }
        Output ONLY raw JSON.
        """

        response = client.models.generate_content(
            model="gemini-3-flash-preview", 
            contents=[video_file, surgical_prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0
            )
        )

        # 4. Clean up the local temp file
        os.remove(temp_path)
        logger.info("✅ Transcription Complete. Sending to Frontend.")

        return json.loads(response.text)

    except Exception as e:
        logger.error(f"❌ Error during processing: {str(e)}")
        if os.path.exists(temp_path):
            os.remove(temp_path)
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Use 8001 to avoid clashing with your teammate's 8000
    uvicorn.run(app, host="0.0.0.0", port=8001)