import asyncio
import websockets
import tempfile
import json
import os
import soundfile as sf
import numpy as np
import cv2
import time
from backend.face_tracker import detect_faces
from backend.mouth_motion import is_mouth_moving
from backend.speaker_mapper import assign_tracking_id, store_speaker_event, match_speaker_to_transcription
from backend.transcriber import transcribe_audio

SAMPLE_RATE = 16000
DTYPE = np.int16

async def transcribe_stream(websocket):
    print("🔗 Client connected!")
    prev_frame = None

    try:
        async for message in websocket:
            if isinstance(message, bytes):
                # Assume audio bytes
                pcm_array = np.frombuffer(message, dtype=DTYPE)
                with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_wav:
                    sf.write(temp_wav.name, pcm_array, SAMPLE_RATE)
                    audio_path = temp_wav.name

                timestamp = time.time()
                transcription = transcribe_audio(audio_path)
                os.remove(audio_path)

                # Placeholder: Capture frame from video source
                # In actual implementation, frame should be received from frontend
                frame = np.zeros((480, 640, 3), dtype=np.uint8)  # Black frame as placeholder

                detected_faces = detect_faces(frame)
                active_speakers = []

                for face in detected_faces:
                    if prev_frame is not None and is_mouth_moving(prev_frame, frame, face["bbox"]):
                        speaker_id = assign_tracking_id()
                        bbox = face["bbox"]
                        store_speaker_event(speaker_id, timestamp, bbox)
                        active_speakers.append({"speaker_id": speaker_id, "bbox": bbox})

                prev_frame = frame.copy()

                matched_speaker = match_speaker_to_transcription(transcription["timestamp"])

                payload = {
                    "transcription": transcription["text"],
                    "speaker_id": matched_speaker["speaker_id"] if matched_speaker else None,
                    "bbox": matched_speaker["bbox"] if matched_speaker else None
                }

                await websocket.send(json.dumps(payload))
            else:
                print("Non-bytes message ignored.")
    except websockets.exceptions.ConnectionClosed:
        print("🔌 Client disconnected!")

async def start_server():
    async with websockets.serve(transcribe_stream, "0.0.0.0", 8765):
        print("🚀 Server running on ws://0.0.0.0:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(start_server())
