import asyncio
import os
import sys
import uuid
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

from pydub import AudioSegment
from openai import AsyncOpenAI


# ----------------------------
# Config
# ----------------------------

DEFAULT_API_BASE = os.getenv("WHISPER_API_URL", "http://localhost:7801/v1")
DEFAULT_TRANSCRIPTION_MODEL = os.getenv("WHISPER_MODEL", "stt_model")


@dataclass
class TranscribeConfig:
    # STT
    api_key: str = "EMPTY"  # local server usually ignores this; keep harmless default
    api_base: str = DEFAULT_API_BASE
    model: str = DEFAULT_TRANSCRIPTION_MODEL

    # Force Malay at STT level
    language: str = "ms"  # <-- IMPORTANT: force Malay output

    # Chunking
    segment_length_ms: int = 30_000
    overlap_ms: int = 500

    # Concurrency
    max_concurrency: int = 6

    # Output
    output_format: str = "srt"  # "srt" | "txt" | "timed_txt"

    # Quality knobs
    temperature: float = 0.1
    extra_body: Optional[dict] = None

    # Temporary files
    temp_root: Optional[Path] = None  # default: <cwd>/temp


class AudioTranscriber:
    """
    Single-pass STT pipeline, forced to Malay via language='ms'.
    """

    def __init__(self, cfg: TranscribeConfig):
        if cfg.overlap_ms >= cfg.segment_length_ms:
            raise ValueError("overlap_ms must be smaller than segment_length_ms")

        self.cfg = cfg
        self.client = AsyncOpenAI(api_key=cfg.api_key, base_url=cfg.api_base)

        self.temp_root = cfg.temp_root or (Path.cwd() / "temp")
        self.temp_root.mkdir(parents=True, exist_ok=True)

    # ----------------------------
    # Utilities
    # ----------------------------

    @staticmethod
    def _ms_to_srt_time(ms: int) -> str:
        hours = ms // 3_600_000
        ms %= 3_600_000
        minutes = ms // 60_000
        ms %= 60_000
        seconds = ms // 1_000
        ms %= 1_000
        return f"{hours:02d}:{minutes:02d}:{seconds:02d},{ms:03d}"

    @classmethod
    def _srt_block(cls, index: int, start_ms: int, end_ms: int, text: str) -> str:
        return (
            f"{index}\n"
            f"{cls._ms_to_srt_time(start_ms)} --> {cls._ms_to_srt_time(end_ms)}\n"
            f"{text.strip()}\n"
        )

    @staticmethod
    def _clean_repetitions(text: str, max_repeat: int = 3) -> str:
        if not text:
            return text
        words = text.split()
        out = []
        i = 0
        while i < len(words):
            w = words[i]
            j = i + 1
            while j < len(words) and words[j] == w:
                j += 1
            run_len = j - i
            out.extend([w] * min(run_len, max_repeat))
            i = j
        return " ".join(out)

    # ----------------------------
    # Audio processing
    # ----------------------------

    def _make_run_dir(self) -> Path:
        run_id = uuid.uuid4().hex[:10]
        run_dir = self.temp_root / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        return run_dir

    def convert_to_wav(self, input_path: str, run_dir: Path) -> Path:
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file not found: {input_path}")
        audio = AudioSegment.from_file(input_path)
        wav_path = run_dir / f"{Path(input_path).stem}_converted.wav"
        audio.export(wav_path, format="wav")
        return wav_path

    def split_audio(self, input_path: str, run_dir: Path) -> Tuple[List[Path], int]:
        # Always work from a WAV in run_dir for consistency
        if input_path.lower().endswith(".wav"):
            src = Path(input_path)
            wav_path = run_dir / src.name
            shutil.copy2(src, wav_path)
        else:
            wav_path = self.convert_to_wav(input_path, run_dir)

        audio = AudioSegment.from_wav(wav_path)
        duration_ms = len(audio)

        step = self.cfg.segment_length_ms - self.cfg.overlap_ms
        segment_paths: List[Path] = []

        i = 0
        start_ms = 0
        while start_ms < duration_ms:
            end_ms = min(start_ms + self.cfg.segment_length_ms, duration_ms)
            chunk = audio[start_ms:end_ms]
            if len(chunk) <= 0:
                break

            seg_path = run_dir / f"segment_{i:04d}_{start_ms}ms_{end_ms}ms.wav"
            chunk.export(seg_path, format="wav")
            segment_paths.append(seg_path)

            i += 1
            if end_ms >= duration_ms:
                break
            start_ms += step

        return segment_paths, duration_ms

    def _parse_segment_times_from_name(self, segment_path: Path) -> Tuple[int, int]:
        parts = segment_path.stem.split("_")
        try:
            start_ms = int(parts[-2].replace("ms", ""))
            end_ms = int(parts[-1].replace("ms", ""))
            return start_ms, end_ms
        except Exception:
            return 0, 0

    # ----------------------------
    # Transcription (FORCE Malay)
    # ----------------------------

    def _build_transcribe_kwargs(self, file_obj) -> dict:
        kwargs = {
            "file": file_obj,
            "model": self.cfg.model,
            "response_format": "json",
            "temperature": self.cfg.temperature,
            "language": self.cfg.language,  # <-- FORCE MALAY HERE
            # optional prompt
            "prompt": "Transkripsi dalam Bahasa Melayu.",
        }
        kwargs["extra_body"] = self.cfg.extra_body or {"seed": 42, "repetition_penalty": 1.1}
        return kwargs

    async def transcribe_segment_async(self, segment_path: Path, sem: asyncio.Semaphore) -> str:
        async with sem:
            try:
                with open(segment_path, "rb") as f:
                    resp = await self.client.audio.transcriptions.create(**self._build_transcribe_kwargs(f))
                return getattr(resp, "text", "") or ""
            except Exception as e:
                print(f"[WARN] Failed segment {segment_path.name}: {e}")
                return ""

    async def transcribe_file(self, audio_path: str, output_path: Optional[str] = None) -> str:
        run_dir = self._make_run_dir()
        try:
            segments, duration_ms = self.split_audio(audio_path, run_dir)
            if not segments:
                raise RuntimeError("No audio segments were created (empty/unsupported file?).")

            fmt = self.cfg.output_format.lower().strip()
            if output_path is None:
                stem = Path(audio_path).stem
                if fmt == "srt":
                    output_path = f"{stem}_transcription.srt"
                elif fmt == "timed_txt":
                    output_path = f"{stem}_transcription_timed.txt"
                else:
                    output_path = f"{stem}_transcription.txt"

            print(f"Input: {audio_path}")
            print(f"API: {self.cfg.api_base}")
            print(f"Model: {self.cfg.model}")
            print(f"Language: {self.cfg.language} (forced)")
            print(f"Segments: {len(segments)}")
            print(f"Concurrency: {self.cfg.max_concurrency}")
            print(f"Format: {fmt}")

            sem = asyncio.Semaphore(self.cfg.max_concurrency)

            segments_sorted = sorted(segments, key=lambda p: self._parse_segment_times_from_name(p)[0])
            tasks = [self.transcribe_segment_async(p, sem) for p in segments_sorted]
            texts = await asyncio.gather(*tasks)

            if fmt == "srt":
                blocks = []
                for idx, (seg_path, text) in enumerate(zip(segments_sorted, texts), start=1):
                    text = self._clean_repetitions(text).strip()
                    if not text:
                        continue
                    start_ms, end_ms = self._parse_segment_times_from_name(seg_path)
                    if start_ms == 0 and end_ms == 0:
                        start_ms = (idx - 1) * (self.cfg.segment_length_ms - self.cfg.overlap_ms)
                        end_ms = min(start_ms + self.cfg.segment_length_ms, duration_ms)
                    blocks.append(self._srt_block(idx, start_ms, end_ms, text))

                result = "\n".join(blocks).strip() + "\n"
                Path(output_path).write_text(result, encoding="utf-8")
                return result

            elif fmt == "timed_txt":
                lines = []
                for seg_path, text in zip(segments_sorted, texts):
                    text = self._clean_repetitions(text).strip()
                    if not text:
                        continue
                    start_ms, _ = self._parse_segment_times_from_name(seg_path)
                    start_sec = start_ms // 1000
                    mm = start_sec // 60
                    ss = start_sec % 60
                    lines.append(f"[{mm:02d}:{ss:02d}] {text}")

                result = "\n\n".join(lines).strip() + "\n"
                Path(output_path).write_text(result, encoding="utf-8")
                return result

            else:  # txt
                merged = " ".join(t.strip() for t in texts if t and t.strip())
                merged = self._clean_repetitions(merged).strip()
                Path(output_path).write_text(merged + "\n", encoding="utf-8")
                return merged

        finally:
            try:
                if run_dir.exists():
                    shutil.rmtree(run_dir)
            except Exception as e:
                print(f"[WARN] Could not clean temp dir {run_dir}: {e}")


# ----------------------------
# CLI / main
# ----------------------------

def pick_input_file(default_name: str) -> str:
    if os.path.exists(default_name):
        return default_name

    print(f"Error: Input file '{default_name}' not found.\n")
    print("Available audio/video files in current directory:")
    candidates = [
        f for f in os.listdir(".")
        if f.lower().endswith((".mp3", ".m4a", ".wav", ".mp4", ".m4b", ".aac", ".ogg"))
    ]
    for f in candidates:
        print(f"  - {f}")
    sys.exit(1)


async def amain():
    input_file_default = "WhatsApp Audio 2025-08-30 at 4.55.42 PM.mp4"
    input_file = pick_input_file(input_file_default)

    cfg = TranscribeConfig(
        api_base=DEFAULT_API_BASE,
        model=DEFAULT_TRANSCRIPTION_MODEL,
        language="ms",          # <-- FORCE MALAY
        segment_length_ms=30_000,
        overlap_ms=500,
        max_concurrency=6,
        output_format="srt",
        temperature=0.1,
        extra_body={"seed": 42, "repetition_penalty": 1.1},
    )

    transcriber = AudioTranscriber(cfg)
    transcription = await transcriber.transcribe_file(input_file, output_path=None)

    print("\nFinal Transcription (Malay forced):")
    print("-" * 50)
    print(transcription)


def main():
    try:
        asyncio.run(amain())
    except KeyboardInterrupt:
        print("\nInterrupted.")
        sys.exit(130)


if __name__ == "__main__":
    main()
