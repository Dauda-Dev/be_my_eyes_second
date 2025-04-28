import time

recent_speakers = []

def assign_tracking_id():
    return f"speaker_{int(time.time() * 1000)}"

def store_speaker_event(speaker_id, timestamp, bbox):
    recent_speakers.append({
        "speaker_id": speaker_id,
        "timestamp": timestamp,
        "bbox": bbox
    })
    if len(recent_speakers) > 100:
        recent_speakers.pop(0)

def match_speaker_to_transcription(transcript_timestamp):
    for entry in reversed(recent_speakers):
        if abs(entry["timestamp"] - transcript_timestamp) < 1.0:
            return entry
    return None
