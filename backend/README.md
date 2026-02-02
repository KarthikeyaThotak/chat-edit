# Backend File

## FAST API SERVER
we are creating FAST API Server to run our AI agents

## Build tools wheels (backend/tools/)

**video_cli** (required for tools.py):

```bash
cd backend/tools/video-cli
pip install wheel
pip wheel . --no-deps -w ..
# Puts video_cli-1.3.3-py3-none-any.whl in backend/tools/
```

Or from backend: `(cd tools/video-cli && pip wheel . --no-deps -w ..)`

**pixelcut-tools** (optional):

```bash
cd backend
pip install -r requirements-build.txt
./tools/build_whl.sh
```

## Testing the tools in Postman

Base URL: `http://localhost:8000` (or your server URL). Run the server from the **backend** directory: `uvicorn main:app --reload`.

For each request: **Method = POST**, **Body = raw → JSON**.

### 1. Upload a video (get `video_id`)

- **URL:** `POST /upload`
- **Body:** Form-data, key `video` (type File), choose a video file.
- **Response:** `video_id` and `file_path`. Use `video_id` in tool calls below, or use the `file_path` (absolute path on server) for `/tools/*`.

### 2. Trim video

- **URL:** `POST /tools/trim`
- **Body (JSON):**
```json
{
  "video_id": 1,
  "start": 5,
  "end": 10,
  "inplace": true
}
```
  Or with server path: `"file_path": "/full/path/to/video.mp4"` (and omit `video_id`).

### 3. Remove segment

- **URL:** `POST /tools/remove_segment`
- **Body (JSON):**
```json
{
  "video_id": 1,
  "start": 5,
  "end": 10,
  "inplace": true
}
```

### 4. Mute segment

- **URL:** `POST /tools/mute_segment`
- **Body (JSON):**
```json
{
  "video_id": 1,
  "start": 5,
  "end": 10,
  "inplace": true
}
```

### 5. Retime (change speed)

- **URL:** `POST /tools/retime`
- **Body (JSON):**
```json
{
  "video_id": 1,
  "factor": 2,
  "inplace": true
}
```
  `factor`: e.g. `2` = 2x faster, `0.5` = half speed.

### 6. Add text overlay

- **URL:** `POST /tools/add_text_overlay`
- **Body (JSON):**
```json
{
  "video_id": 1,
  "text": "Hello",
  "start": 2,
  "end": 10,
  "y": 0.8,
  "inplace": true
}
```
  `y`: vertical position 0–1 (e.g. `0.8` = 80% down).

### Summary

| Tool              | Endpoint                   | Required body (with `video_id`)     |
|-------------------|----------------------------|-------------------------------------|
| Trim              | `POST /tools/trim`         | `video_id`, `start`, `end`          |
| Remove segment    | `POST /tools/remove_segment` | `video_id`, `start`, `end`        |
| Mute segment      | `POST /tools/mute_segment` | `video_id`, `start`, `end`        |
| Retime            | `POST /tools/retime`       | `video_id`, `factor`               |
| Add text overlay  | `POST /tools/add_text_overlay` | `video_id`, `text`, `start`, `end` |

Use either `video_id` (from `/upload`) or `file_path` (absolute path on server). Set `inplace: false` to keep the original file and get a new output file.
