import argparse
import os.path as osp
import subprocess
import pprint
import shutil


def remove_segment(in_file, start, end, inplace=False):
    if start < 0:
        raise ValueError("start must be >= 0")
    if end <= start:
        raise ValueError("end must be greater than start")

    stem, ext = osp.splitext(in_file)
    out_file = stem + f"_remove{start:.3g}-{end:.3g}" + ext

    filter_complex = (
        f"[0:v]trim=0:{start},setpts=PTS-STARTPTS[v0];"
        f"[0:a]atrim=0:{start},asetpts=PTS-STARTPTS[a0];"
        f"[0:v]trim={end},setpts=PTS-STARTPTS[v1];"
        f"[0:a]atrim={end},asetpts=PTS-STARTPTS[a1];"
        f"[v0][a0][v1][a1]concat=n=2:v=1:a=1[outv][outa]"
    )

    cmd = [
        "ffmpeg",
        "-y",
        "-i", in_file,
        "-filter_complex", filter_complex,
        "-map", "[outv]",
        "-map", "[outa]",
        "-movflags", "+faststart",
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
    parser.add_argument(
        "--inplace", "-i", action="store_true", help="operate in-place"
    )

    args = parser.parse_args()
    pprint.pprint(vars(args))

    for in_file in args.in_files:
        remove_segment(
            in_file=in_file,
            start=args.start,
            end=args.end,
            inplace=args.inplace,
        )