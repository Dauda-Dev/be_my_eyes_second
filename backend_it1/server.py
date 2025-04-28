
import asyncio
import websockets
import tempfile
import json
import os
import base64
import numpy as np
import cv2
import soundfile as sf
import time

from backend_it1.face_tracker import detect_faces
from backend_it1.mouth_motion import is_mouth_moving
from backend_it1.speaker_mapper import assign_tracking_id, store_speaker_event, match_speaker_to_transcription
from backend_it1.transcriber import transcribe_audio

SAMPLE_RATE = 16000

def decode_base64_audio(base64_str):
    audio_bytes = base64.b64decode(base64_str)
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        temp_audio.write(audio_bytes)
        return temp_audio.name

def decode_base64_image(base64_str):
    img_data = base64.b64decode(base64_str)
    img_array = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(img_array, cv2.IMREAD_COLOR)

async def transcribe_stream(websocket):
    print("🔗 Client connected!")
    prev_frame = None

    try:
        async for message in websocket:
            try:
                data = json.loads(message)

                if data.get("type") != "audio_video":
                    await websocket.send(json.dumps({"error": "Unsupported message type"}))
                    continue

                timestamp = data["timestamp"]
                audio_path = decode_base64_audio(data["audio"])
                frame = decode_base64_image(data["image"])

                detected_faces = detect_faces(frame)
                active_speakers = []

                for face in detected_faces:
                    if prev_frame is not None and is_mouth_moving(prev_frame, frame, face["bbox"]):
                        speaker_id = assign_tracking_id()
                        bbox = face["bbox"]
                        store_speaker_event(speaker_id, timestamp, bbox)
                        active_speakers.append({"speaker_id": speaker_id, "bbox": bbox})

                prev_frame = frame.copy()

                transcription = transcribe_audio(audio_path)
                os.remove(audio_path)

                matched_speaker = match_speaker_to_transcription(timestamp)

                payload = {
                    "transcription": transcription["text"],
                    "speaker_id": matched_speaker["speaker_id"] if matched_speaker else None,
                    "bbox": matched_speaker["bbox"] if matched_speaker else None
                }

                await websocket.send(json.dumps(payload))

            except Exception as e:
                error = {"error": f"Failed to process message: {str(e)}"}
                print(error)
                await websocket.send(json.dumps(error))

    except websockets.exceptions.ConnectionClosed:
        print("🔌 Client disconnected")

async def start_server():
    async with websockets.serve(transcribe_stream, "0.0.0.0", 8765):
        print("🚀 WebSocket server running on ws://0.0.0.0:8765")
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(start_server())
