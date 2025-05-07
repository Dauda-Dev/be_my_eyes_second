import asyncio
import json
import os

import websockets
from backend.decode.decoder import decode_image, decode_audio
from backend.images.face_detection import detect_faces
# from backend.model.transcriber import transcribe
from backend.audio.speaker_estimation import estimate_speaker
# from backend.model.yoruba_transcriber import transcribe_and_translate
from backend.model.groq.groq_transcriber import transcribe_audio
from backend.model.groq.translator import translate_text
from backend.audio.volume_check import get_audio_volume, check_volume_threshold
from backend.audio.volume_check import is_valid_transcription
from backend.images.bounding_box_drawer import encode_image_to_base64, draw_bounding_boxes_on_image
from backend.errorHandler.error import volume_error
from backend.audio.clean_audio import clean_audio


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
            print(audio_path)

            transcribe_language = data["transcribe_lang"]
            translate_language = data["translate_lang"]

            image_width = data.get("image_width")
            image_height = data.get("image_height")

            frame_dim = [image.shape[0], image.shape[1]]
            if image_width and image_height:
                frame_dim = [image_height, image_width]

            # Step 1️⃣: Check audio volume

            volume = get_audio_volume(audio_path)
            print(f"🔊 Volume: {volume:.5f}")
            if check_volume_threshold(volume) is False:
                print("⚠️ Audio too quiet — skipping transcription")
                await websocket.send(json.dumps(volume_error))
                continue

            cleaned_audio_path = clean_audio(audio_path)
            print(f'cleaned audio output')
            faces = detect_faces(image)

            # if faces is None or len(faces) == 0:
            #     # await websocket.send(json.dumps({"error": "No faces detected"}))
            #     continue

            # transcription = transcribe(audio_path)

            # transcription, translation = transcribe_and_translate(audio_path)
            transcription = await transcribe_audio(cleaned_audio_path, transcribe_language)

            print(f'{transcription} ')
            if not is_valid_transcription(transcription):
                print("⚠️ Ignoring low-quality transcription")
                return  # or continue

            translation = await translate_text(transcription, translate_language)

            speaker_id, bbox = estimate_speaker(faces, image,  cleaned_audio_path)
            os.remove(audio_path)
            # Draw bbox
            annotated_image = draw_bounding_boxes_on_image(image.copy(), [bbox], speaker_id)
            image_base64 = encode_image_to_base64(annotated_image)

            json_dumps = json.dumps({
                "bboxes": [{"bbox": bbox, "speaker_id": str(speaker_id), "frame_dim": frame_dim}],
                "transcription": {  # ✅ Correct spelling here!
                    "speaker_id": str(speaker_id),
                    "text": transcription,
                    "translation": translation
                },
                "image": image_base64
            })

            await websocket.send(json_dumps)
    except websockets.exceptions.ConnectionClosed:
        print("🔌 Client disconnected")


async def main():
    async with websockets.serve(handle_connection, "0.0.0.0", 8000, max_size=16_000_000):
        print("🚀 WebSocket server running on ws://0.0.0.0:8000")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
