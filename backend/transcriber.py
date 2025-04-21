from faster_whisper import WhisperModel

# Load the Whisper model
model = WhisperModel("base", compute_type="int8", device="cpu")

def transcribe_audio(file_path, language="en"):
    """
    Transcribes the given audio file in the specified language using faster-whisper.
    Returns a dict with the full text and the timestamp of the first segment.
    """
    segments, info = model.transcribe(file_path, language=language)

    text = ""
    first_timestamp = None

    for segment in segments:
        text += segment.text.strip() + " "
        if first_timestamp is None:
            first_timestamp = segment.start

    return {
        "text": text.strip(),
        "timestamp": float(first_timestamp) if first_timestamp is not None else 0.0
    }
