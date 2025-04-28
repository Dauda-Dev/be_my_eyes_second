import cv2
import numpy as np

def is_mouth_moving(prev_frame, curr_frame, face_bbox):
    x, y, w, h = face_bbox
    prev_mouth = prev_frame[y:y+h, x:x+w]
    curr_mouth = curr_frame[y:y+h, x:x+w]

    prev_gray = cv2.cvtColor(prev_mouth, cv2.COLOR_BGR2GRAY)
    curr_gray = cv2.cvtColor(curr_mouth, cv2.COLOR_BGR2GRAY)

    diff = cv2.absdiff(prev_gray, curr_gray)
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)
    movement = np.sum(thresh) / 255

    return movement > 500  # Threshold for mouth movement
