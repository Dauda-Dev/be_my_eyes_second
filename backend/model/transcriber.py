
from faster_whisper import WhisperModel

model = WhisperModel("base", compute_type="int8", device="cpu")

def transcribe(audio_path):
    segments, _ = model.transcribe(audio_path, language='en')
    return " ".join([s.text for s in segments])
