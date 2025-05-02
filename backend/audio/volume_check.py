import numpy as np
import librosa

import torchaudio
import subprocess
import tempfile
import os


def get_audio_volume(path: str) -> float:
    waveform, _ = torchaudio.load(path)

    # If stereo, average to mono
    if waveform.shape[0] > 1:
        waveform = waveform.mean(dim=0, keepdim=True)

    rms = (waveform ** 2).mean().sqrt().item()  # Root Mean Square volume
    return rms

def is_valid_transcription(text: str):
    return bool(text.strip()) and any(char.isalpha() for char in text) and len(text.split()) >= 2

def convert_aac_to_wav(aac_path: str) -> str:
    wav_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    wav_path = wav_temp.name
    wav_temp.close()

    command = [
        "ffmpeg", "-y", "-i", aac_path,
        "-ar", "16000", "-ac", "1",  # Sample rate: 16kHz, mono
        wav_path
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return wav_path
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"❌ FFmpeg conversion failed: {e}")