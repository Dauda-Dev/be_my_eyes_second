
import base64
import tempfile
import numpy as np
import cv2
import soundfile as sf
import torchaudio
import torchaudio.transforms as T

def decode_image(b64_string):
    img_data = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    print(image.shape)
    return image
#
#
# def decode_audio(b64_string):
#     """
#     Decode base64 audio and save it correctly as WAV 16-bit PCM.
#     """
#     audio_bytes = base64.b64decode(b64_string)
#
#     temp_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
#
#     # Assume 16kHz, mono, 16bit PCM as frontend promised
#     audio_np = np.frombuffer(audio_bytes, dtype=np.int16)
#     sf.write(temp_path, audio_np, 16000, 'PCM_16')
#
#     return temp_path



def decode_audio(b64_string):
    audio_data = base64.b64decode(b64_string)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".aac")
    with open(temp_file.name, "wb") as f:
        f.write(audio_data)
    return temp_file.name
