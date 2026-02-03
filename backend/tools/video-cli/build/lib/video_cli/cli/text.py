import argparse
import os.path as osp
import subprocess
import pprint
import uuid


def add_text_overlay(
    in_file,
    text,
    start,
    end,
    y=0.9,
    font_size=48,
):
    if start < 0:
        raise ValueError("start must be >= 0")
    if end <= start:
        raise ValueError("end must be greater than start")
    if not (0.0 <= y <= 1.0):
        raise ValueError("y must be between 0.0 and 1.0")

    #_, ext = osp.splitext(in_file)
    #out_file = f"{uuid.uuid4()}{ext}"

    stem, ext = osp.splitext(in_file)
    out_file = stem + f"_text{start:.3g}-{end:.3g}" + ext

    # ffmpeg expression:
    # x = center horizontally
    # y = scaled by video height
    # enable = only show between start/end
    drawtext = (
        "drawtext="
        f"text='{text}':"
        "x=(w-text_w)/2:"
        f"y=h*{y}:"
        f"fontsize={font_size}:"
        "fontcolor=white:"
        "box=1:"
        "boxcolor=black@0.5:"
        "boxborderw=10:"
        f"enable='between(t,{start},{end})'"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_file,
        "-vf", drawtext,
        "-c:a", "copy",
        "-movflags", "+faststart",
        out_file,
    ]

    subprocess.run(cmd, check=True)
    return out_file


def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("in_files", nargs="+", help="input video")
    parser.add_argument("--text", required=True, help="overlay text")
    parser.add_argument("--start", type=float, required=True, help="start time (seconds)")
    parser.add_argument("--end", type=float, required=True, help="end time (seconds)")
    parser.add_argument(
        "--y",
        type=float,
        default=0.9,
        help="vertical position (0.0 top → 1.0 bottom)",
    )
    parser.add_argument(
        "--font-size",
        type=int,
        default=30,
        help="font size",
    )

    args = parser.parse_args()
    pprint.pprint(vars(args))

    for in_file in args.in_files:
        add_text_overlay(
            in_file=in_file,
            text=args.text,
            start=args.start,
            end=args.end,
            y=args.y,
            font_size=args.font_size,
        )