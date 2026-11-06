"""Records every line in tools/voice/lines.json with the Kokoro neural voice.

Writes audio/voice/<hash>.mp3 (one per line) and audio/voice/index.json, which the
app uses to play natural speech instead of the device's text-to-speech.
Only new or changed lines are recorded, so re-running is quick.

Setup (once):
  python -m venv tools/voice/.venv
  tools/voice/.venv/Scripts/python -m pip install kokoro-onnx soundfile numpy
  download kokoro-v1.0.onnx and voices-v1.0.bin from
  https://github.com/thewh1teagle/kokoro-onnx/releases (model-files-v1.0)
  into tools/voice/.cache/
Run:
  npm run voice:build      (Hoops & Wheels)
  npm run voice:carwash    (Sudsy Garage)
Optional arguments: <lines.json> <output folder>, both relative to the project root.
"""

import json
import pathlib
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = pathlib.Path(__file__).resolve().parents[2]
CACHE = ROOT / "tools/voice/.cache"
OUT = ROOT / "audio/voice"
VOICE = "af_heart"  # warm, clear US English voice
SPEED = 0.9  # a touch slower for a 5-year-old


def clip_file(key: str) -> str:
    """Same FNV-1a hash as js/voicekey.js clipFile()."""
    h = 0x811C9DC5
    for ch in key:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    digits = "0123456789abcdefghijklmnopqrstuvwxyz"
    s = ""
    while True:
        h, r = divmod(h, 36)
        s = digits[r] + s
        if h == 0:
            break
    return f"{s}.mp3"


def tidy(samples: np.ndarray, sr: int) -> np.ndarray:
    """Trim silence at both ends (keeping a short pad) and even out loudness."""
    level = np.abs(samples)
    loud = np.where(level > 0.02 * level.max())[0]
    if len(loud):
        pad = int(0.03 * sr)
        samples = samples[max(0, loud[0] - pad): loud[-1] + pad]
    peak = np.abs(samples).max() or 1.0
    return (samples / peak * 0.89).astype(np.float32)


def main() -> None:
    global OUT
    lines_file = ROOT / (sys.argv[1] if len(sys.argv) > 1 else "tools/voice/lines.json")
    if len(sys.argv) > 2:
        OUT = ROOT / sys.argv[2]
    lines = json.loads(lines_file.read_text(encoding="utf8"))
    OUT.mkdir(parents=True, exist_ok=True)
    meta_path = OUT / "meta.json"  # remembers what text each clip was recorded from
    meta = json.loads(meta_path.read_text(encoding="utf8")) if meta_path.exists() else {}

    kokoro = Kokoro(str(CACHE / "kokoro-v1.0.onnx"), str(CACHE / "voices-v1.0.bin"))
    index, todo = {}, []
    for line in lines:
        name = clip_file(line["key"])
        index[line["key"]] = name
        if meta.get(name) != line["text"] or not (OUT / name).exists():
            todo.append((name, line["text"]))

    for n, (name, text) in enumerate(todo, 1):
        samples, sr = kokoro.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        sf.write(OUT / name, tidy(samples, sr), sr, format="MP3")
        meta[name] = text
        if n % 25 == 0 or n == len(todo):
            print(f"{n}/{len(todo)} {text}", flush=True)
            meta_path.write_text(json.dumps(meta, indent=0), encoding="utf8")

    keep = set(index.values())
    for f in OUT.glob("*.mp3"):
        if f.name not in keep:
            f.unlink()
            meta.pop(f.name, None)
    meta_path.write_text(json.dumps(meta, indent=0), encoding="utf8")
    (OUT / "index.json").write_text(json.dumps(index, separators=(",", ":")), encoding="utf8")
    print(f"done: {len(index)} clips, {len(todo)} recorded now", file=sys.stderr)


if __name__ == "__main__":
    main()
