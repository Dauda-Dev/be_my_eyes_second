
import base64
import tempfile
import numpy as np
import cv2

def decode_image(b64_string):
    img_data = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_data, np.uint8)
    image = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    print(image.shape)
    return image


def decode_audio(b64_string):
    audio_data = base64.b64decode(b64_string)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".wav")
    with open(temp_file.name, "wb") as f:
        f.write(audio_data)
    return temp_file.name
