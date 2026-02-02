import argparse
import os.path as osp
import pprint
import shutil
import subprocess


def clip(in_file, start=0.0, end=None, inplace=False, reencode_video=True):
    """
    Trim a video file with ffmpeg.

    Why reencode_video=True by default?
    - Stream-copy trimming (-c copy) can produce "audio-only" outputs when the cut
      starts on a non-keyframe. Re-encoding video guarantees decodable frames.
    """
    stem, ext = osp.splitext(in_file)

    if end is None:
        out_file = f"{stem}_trim{start:.3g}-end{ext}"
    else:
        out_file = f"{stem}_trim{start:.3g}-{end:.3g}{ext}"

    # Build ffmpeg command
    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]

    # Put -ss before -i for speed (OK because we re-encode video by default).
    cmd += ["-ss", str(start), "-i", in_file]

    if end is not None:
        duration = float(end) - float(start)
        if duration <= 0:
            raise ValueError(f"end must be > start (start={start}, end={end})")
        cmd += ["-t", str(duration)]

    # Map the primary video and (optional) audio stream.
    cmd += ["-map", "0:v:0", "-map", "0:a:0?"]

    if reencode_video:
        # Reliable: re-encode video, copy audio
        cmd += [
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-crf", "18",
            "-c:a", "copy",
            "-movflags", "+faststart",
        ]
    else:
        # Fast: stream copy (may fail if cut starts off-keyframe)
        # If you use this and see "audio-only", switch back to reencode_video=True.
        cmd += ["-c", "copy"]

    cmd += [out_file]

    subprocess.run(cmd, check=True)

    if inplace:
        if osp.exists(out_file):
            shutil.move(out_file, in_file)
        else:
            raise RuntimeError("Expected output file was not created.")

    return out_file


def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
        description="Trim video(s) using ffmpeg",
    )
    parser.add_argument("in_files", nargs="+", help="input video file(s)")
    parser.add_argument("--start", type=float, default=0.0, help="start time (seconds)")
    parser.add_argument("--duration", type=float, help="duration (seconds)")
    parser.add_argument("--end", type=float, help="end time (seconds). Overrides --duration if set.")
    parser.add_argument("--inplace", "-i", action="store_true", help="operate in-place")
    parser.add_argument(
        "--copy", action="store_true",
        help="stream copy (no re-encode). Faster but may create audio-only clips if not on keyframe.",
    )

    args = parser.parse_args()
    pprint.pprint(vars(args))

    end = None
    if args.end is not None:
        end = args.end
    elif args.duration is not None:
        end = args.start + args.duration

    for in_file in args.in_files:
        out = clip(
            in_file=in_file,
            start=args.start,
            end=end,
            inplace=args.inplace,
            reencode_video=not args.copy,
        )
        if not args.inplace:
            print(f"Wrote: {out}")


if __name__ == "__main__":
    main()
