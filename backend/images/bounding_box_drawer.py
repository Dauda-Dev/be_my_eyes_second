import cv2
import base64
import numpy as np

def draw_bounding_boxes_on_image(image: np.ndarray, faces: list, speaker_id: str):
    # Draw each bounding box
    for bbox in faces:
        if bbox is None:
            print('no face detected to draw bbox')
            continue
        x1, y1, x2, y2 = map(int, bbox)
        color = (0, 255, 0)  # Green box
        print('drawing bbox.........')
        cv2.rectangle(image, (x1, y1), (x2, y2), color, 4)
        cv2.putText(image, f"Speaker {speaker_id}", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX,
                    0.8, color, 4)
    return image

def encode_image_to_base64(image: np.ndarray):
    _, buffer = cv2.imencode('.jpg', image)
    jpg_as_text = base64.b64encode(buffer).decode('utf-8')
    return jpg_as_text
