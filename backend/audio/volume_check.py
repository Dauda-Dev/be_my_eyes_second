import numpy as np
import soundfile as sf
from pydub import AudioSegment
from pydub.utils import which

AudioSegment.converter = which("ffmpeg")  # Ensure ffmpeg is used by pydub
AUDIO_VOLUME_THRESHOLD = 0.01  # 🔇 Adjust this as needed


def get_audio_volume(path: str) -> float:
    try:
        audio, sr = load_audio_to_numpy(path)
        if len(audio.shape) > 1:
            audio = np.mean(audio, axis=1)  # Convert to mono if stereo
        rms = np.sqrt(np.mean(audio ** 2))
        return rms

    except Exception as e:
        raise RuntimeError(f"Failed to calculate audio volume: {e}")


def is_valid_transcription(text: str):
    return bool(text.strip()) and any(char.isalpha() for char in text) and len(text.split()) >= 2


def load_audio_to_numpy(path):
    """
    Attempts to load .wav, .aac, .m4a, or .webm audio to a mono numpy array with 16 kHz sample rate.
    Uses soundfile first, then pydub as a fallback.
    """
    try:
        audio, sr = sf.read(path, always_2d=False)
        print("✅ Loaded audio using soundfile")

        # Convert to mono if stereo
        if audio.ndim > 1:
            audio = np.mean(audio, axis=1)

        # Ensure float32
        audio = audio.astype(np.float32)

        # Resample if needed
        if sr != 16000:
            import librosa
            audio = librosa.resample(audio, orig_sr=sr, target_sr=16000)
            sr = 16000

        return audio, sr

    except Exception as e:
        print(f"⚠️ soundfile failed: {e}")
        print("🔄 Falling back to pydub...")

        try:
            # Let pydub infer the format via ffmpeg
            audio = AudioSegment.from_file(path)
            audio = audio.set_frame_rate(16000).set_channels(1)
            samples = np.array(audio.get_array_of_samples()).astype(np.float32) / (2 ** 15)
            return samples, 16000

        except Exception as ex:
            raise RuntimeError(f"❌ Failed to load audio using both soundfile and pydub: {ex}")


def check_volume_threshold(volume: float):
    if volume < AUDIO_VOLUME_THRESHOLD:
        print("⚠️ Audio too quiet — skipping transcription")
        return False
    return True
