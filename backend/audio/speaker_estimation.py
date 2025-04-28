
import numpy as np
import librosa
import os
from backend.images.face_detection import estimate_distance

def get_audio_volume(path):
    try:
        y, sr = librosa.load(path, sr=16000)
        return np.sqrt(np.mean(np.square(y)))
    except Exception as e:
        print(f" Error loading audio: {e}")
        return 0.0
def estimate_speaker(faces, audio_path):
    volume = get_audio_volume(audio_path)
    os.remove(audio_path)

    best_score = 0
    best_face = None
    speaker_id = None


    for i, face in enumerate(faces):
        distance = estimate_distance(face)
        expected_vol = 1 / (distance ** 2)
        score = expected_vol / (abs(expected_vol - volume) + 1e-6)

        if score > best_score:
            best_score = score
            best_face = face
            speaker_id = i + 1

    if best_face is None or best_score < 0.5:
        print("🗣️ Detected background conversation (no visible speaker match)")
        return None, None

    x, y, w, h = best_face
    bbox = [int(x), int(y), int(x + w), int(y + h)]
    return speaker_id, bbox
