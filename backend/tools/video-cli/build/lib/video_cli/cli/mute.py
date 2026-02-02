import argparse
import os.path as osp
import pprint
import shutil
import subprocess


def mute(in_file: str, start: float, end: float, inplace: bool = False):
    if end <= start:
        raise ValueError("--end must be greater than --start")

    stem, ext = osp.splitext(in_file)
    out_file = f"{stem}_mute{start:.3g}-{end:.3g}{ext}"

    # Mute audio only between [start, end]
    afilter = f"volume=enable=between(t\\,{start}\\,{end}):volume=0"

    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_file,
        "-map", "0:v:0",
        "-map", "0:a:0",
        "-c:v", "copy",
        "-af", afilter,
        "-c:a", "aac",
        out_file,
 ]

    subprocess.run(cmd, check=True)

    if inplace and osp.exists(out_file):
        shutil.move(out_file, in_file)


def main():
    parser = argparse.ArgumentParser(
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("in_files", nargs="+", help="input video")
    parser.add_argument("--start", type=float, required=True, help="start time (seconds)")
    parser.add_argument("--end", type=float, required=True, help="end time (seconds)")
    parser.add_argument("--inplace", "-i", action="store_true", help="operate in-place")
    args = parser.parse_args()

    pprint.pprint(args.__dict__)

    for in_file in args.in_files:
        mute(in_file=in_file, start=args.start, end=args.end, inplace=args.inplace)
