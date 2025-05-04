
import numpy as np
import librosa
import os
from backend.images.face_detection import estimate_distance
import cv2
import mediapipe as mp

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=5, refine_landmarks=True)

def get_lip_movement(landmarks, image_width, image_height):
    # Get upper and lower lip y-coordinates (landmark 13 = upper inner lip, 14 = lower inner lip)
    upper_lip = landmarks[13]
    lower_lip = landmarks[14]

    y_upper = int(upper_lip.y * image_height)
    y_lower = int(lower_lip.y * image_height)

    # Distance between upper and lower lip
    return abs(y_lower - y_upper)

def get_audio_volume(path):
    try:
        y, sr = librosa.load(path, sr=16000)
        return np.sqrt(np.mean(np.square(y)))
    except Exception as e:
        print(f" Error loading audio: {e}")
        return 0.0


def estimate_speaker(faces, image, audio_path):
    volume = get_audio_volume(audio_path)
    os.remove(audio_path)

    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(image_rgb)

    best_score = 0
    best_face = None
    speaker_id = None

    if results.multi_face_landmarks:
        for i, (face_box, landmarks) in enumerate(zip(faces, results.multi_face_landmarks)):
            distance = estimate_distance(face_box)
            expected_vol = 1 / (distance ** 2)

            lip_movement = get_lip_movement(landmarks.landmark, image.shape[1], image.shape[0])
            lip_score = min(1.0, lip_movement / 25)  # Normalize (25 pixels = strong mouth movement)

            volume_score = expected_vol / (abs(expected_vol - volume) + 1e-6)

            combined_score = 0.5 * lip_score + 0.5 * volume_score

            if combined_score > best_score:
                best_score = combined_score
                best_face = face_box
                speaker_id = i + 1

    if best_face is None or best_score < 0.5:
        print("🗣️ Detected background conversation (no visible speaker match)")
        return None, None

    x1, y1, x2, y2 = best_face
    bbox = [int(x1), int(y1), int(x2), int(y2)]
    return speaker_id, bbox
