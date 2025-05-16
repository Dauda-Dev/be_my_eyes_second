import asyncio
import json
import os
import sys
from urllib.parse import urlparse, parse_qs
import uuid

import websockets
from backend.decode.decoder import decode_image, decode_audio
from backend.images.face_detection import detect_faces
from backend.audio.speaker_estimation import estimate_speaker
from backend.model.groq.groq_transcriber import transcribe_audio
from backend.model.groq.translator import translate_text
from backend.audio.volume_check import get_audio_volume, check_volume_threshold
from backend.audio.volume_check import is_valid_transcription
from backend.images.bounding_box_drawer import encode_image_to_base64, draw_bounding_boxes_on_image
from backend.errorHandler.error import volume_error
from backend.audio.clean_audio import clean_audio
from backend.database.db import save_message,get_unacknowledged_messages, acknowledge_message

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

connected_clients = {}


LANGUAGES = {
    "en": "English",
    "yo": "Yoruba",
    "fr": "French",
    "es": "Spanish",
    "ig": "Igbo",
    "ha": "Hausa"
}


async def resend_unacknowledged(websocket, client_id):
    print('initiating resend of unacknowledged tasks')
    while True:
        await asyncio.sleep(30)  # every 1 minute
        messages = await get_unacknowledged_messages(client_id)
        for row in messages:
            try:
                await websocket.send(row["message"])
                print(f"🔁 Retried message for {client_id}")
            except:
                pass  # client may be disconnected



async def handle_connection(websocket):
    # Extract client_id from the websocket request URI

    query = parse_qs(urlparse(websocket.request.path).query)
    client_id = query.get('client_id', [None])[0]

    if client_id is None:
        print("❌ client_id missing")
        await websocket.close()
        return

    connected_clients[client_id] = websocket
    print(f"🔗 Client connected: {client_id}")

    asyncio.create_task(
    resend_unacknowledged(websocket, client_id))

    try:
        async for message in websocket:
            asyncio.create_task(process_message(websocket, client_id, message))


    except websockets.exceptions.ConnectionClosed:
        print(f"🔌 Client disconnected: {client_id}")
    finally:
        connected_clients.pop(client_id, None)


async def process_message(websocket, client_id, message):
    try:
        data = json.loads(message)
        print(f"📩 Message received from {client_id}: {data.get('timestamp')}")

        if data.get("type") == "ack":
            message_id = data.get("message_id")
            if message_id:
                print(f'recieved acknowledgment message {message_id}')
                await acknowledge_message(client_id, message_id)
                print(f"✅ Acknowledgment received for message ID {message_id}")
            return

        if data.get("type") != "audio_video":
            return

        timestamp = data["timestamp"]
        # image = decode_image(data["image"])
        audio_path = decode_audio(data["audio"])
        print(audio_path)

        transcribe_language = data["transcribe_lang"]
        translate_language = data["translate_lang"]

        # image_width = data.get("image_width")
        # image_height = data.get("image_height")

        # frame_dim = [image.shape[0], image.shape[1]]
        # if image_width and image_height:
        #     frame_dim = [image_height, image_width]

        # Step 1️⃣: Check audio volume
        volume = get_audio_volume(audio_path)
        print(f"🔊 Volume: {volume:.5f}")
        if not check_volume_threshold(volume):
            print("⚠️ Audio too quiet — skipping transcription")
            await websocket.send(json.dumps(volume_error))
            return

        cleaned_audio_path = clean_audio(audio_path)
        # faces = detect_faces(image)

        transcription = await transcribe_audio(cleaned_audio_path, transcribe_language)
        print(f'transcription: {transcription}')
        if not is_valid_transcription(transcription):
            print("⚠️ Ignoring low-quality transcription")
            return

        translation = await translate_text(transcription, LANGUAGES[transcribe_language], translate_language)
        print(f'translation: {translation}')
        if translation == 'incoherent':
            print('the txt is not coherent')
            return

        # speaker_id, bbox = estimate_speaker(faces, image, cleaned_audio_path)
        os.remove(audio_path)

        # Draw bbox
        # annotated_image = draw_bounding_boxes_on_image(image.copy(), [bbox], speaker_id)
        # image_base64 = encode_image_to_base64(annotated_image)
        message_id = str(uuid.uuid4())

        result = {
            "message_id": message_id,
            # "bboxes": [{"bbox": bbox, "speaker_id": str(speaker_id), "frame_dim": frame_dim}],
            "transcription": {
                # "speaker_id": str(speaker_id),
                "text": transcription,
                "translation": translation
            },
            # "image": image_base64,
            "timestamp": timestamp,
            "type": "response"
        }

        await save_message(client_id, json.dumps(result), message_id)

        await websocket.send(json.dumps(result))

    except Exception as e:
        print(f"❌ Error in processing message from {client_id}: {str(e)}")


async def main():
    async with websockets.serve(handle_connection, "0.0.0.0", 8000, max_size=16_000_000, ping_interval=30, ping_timeout=60):
        print("🚀 WebSocket server running on ws://0.0.0.0:8000")
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
