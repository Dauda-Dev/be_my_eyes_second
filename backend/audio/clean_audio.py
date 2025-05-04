import tempfile
import subprocess


def clean_audio(input_path: str) -> str:
    # Create a temporary output AAC file
    cleaned_temp = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")

    command = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-af", "afftdn,loudnorm,volume=5dB,atempo=0.95",
        "-acodec", "pcm_s16le",
        "-ar", "16000",  # Match original sample rate if needed
        cleaned_temp.name
    ]

    subprocess.run(command, check=True)
    return cleaned_temp.name
