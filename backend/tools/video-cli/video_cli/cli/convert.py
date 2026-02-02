import argparse
import os.path as osp
import subprocess
import pprint
import uuid


def convert_video(
    in_file,
    out_format,
    vcodec="libx264",
    acodec="aac",
    width=None,
):
    #out_file = f"{uuid.uuid4()}.{out_format}"
    stem, _ = osp.splitext(in_file)
    out_file = stem + f".{out_format}"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_file,
    ]

    if width:
        cmd += ["-vf", f"scale={width}:-2"]

    cmd += [
        "-c:v", vcodec,
        "-c:a", acodec,
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
    parser.add_argument(
        "--format",
        required=True,
        help="output format (mp4, webm, mov, mkv, etc.)",
    )
    parser.add_argument(
        "--vcodec",
        default="libx264",
        help="video codec (e.g. libx264, libx265, libvpx-vp9)",
    )
    parser.add_argument(
        "--acodec",
        default="aac",
        help="audio codec (e.g. aac, libopus, copy)",
    )
    parser.add_argument(
        "--width",
        type=int,
        help="resize video to this width (keeps aspect ratio)",
    )

    args = parser.parse_args()
    pprint.pprint(vars(args))

    for in_file in args.in_files:
        convert_video(
            in_file=in_file,
            out_format=args.format,
            vcodec=args.vcodec,
            acodec=args.acodec,
            width=args.width,
        )