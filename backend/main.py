import asyncio
import json
import websockets
from backend.decode.decoder import decode_image, decode_audio
from backend.images.face_detection import detect_faces
from backend.model.transcriber import transcribe
from backend.audio.speaker_estimation import estimate_speaker
from backend.model.yoruba_transcriber import transcribe_and_translate


async def handle_connection(websocket):
    print("🔗 Client connected")
    try:
        async for message in websocket:
            data = json.loads(message)
            print(data["timestamp"])
            if data.get("type") != "audio_video":
                continue

            timestamp = data["timestamp"]
            image = decode_image(data["image"])
            audio_path = decode_audio(data["audio"])

            faces = detect_faces(image)
            # if faces is None or len(faces) == 0:
            #     # await websocket.send(json.dumps({"error": "No faces detected"}))
            #     continue

            transcription = transcribe(audio_path)

            # transcription, translation = transcribe_and_translate(audio_path)
            speaker_id, bbox = estimate_speaker(faces, audio_path)
            print(f'{transcription}  {speaker_id}')

            jsonDumps = json.dumps({
                'bboxes': [{"bbox": bbox, "speaker_id": str(speaker_id), "frame_dim":[image.shape[0], image.shape[1]]}],
                'transcription': {  # ✅ Correct spelling here!
                    "speaker_id": str(speaker_id),
                    "text": transcription
                }
            })

            # jsonDumps = json.dump({"name": "dauda oziegbe"})
            print(jsonDumps)
            await websocket.send(jsonDumps)
    except websockets.exceptions.ConnectionClosed:
        print("🔌 Client disconnected")


async def main():
    async with websockets.serve(handle_connection, "0.0.0.0", 8765, max_size=16_000_000):
        print("🚀 WebSocket server running on ws://0.0.0.0:8765")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
