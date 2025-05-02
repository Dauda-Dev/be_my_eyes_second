
# import cv2
#
# face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
#
# def detect_faces(image):
#     gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
#     faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
#     return faces


import cv2
import mediapipe as mp

mp_face_detection = mp.solutions.face_detection

# Create the face detector only once
face_detector = mp_face_detection.FaceDetection(model_selection=0, min_detection_confidence=0.5)

def detect_faces(image):
    """Detect faces in a BGR image and return bounding boxes as (x1, y1, x2, y2)"""
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = face_detector.process(image_rgb)

    faces = []
    if results.detections:
        for detection in results.detections:
            bboxC = detection.location_data.relative_bounding_box
            h, w, _ = image.shape
            x1 = int(bboxC.xmin * w)
            y1 = int(bboxC.ymin * h)
            x2 = int((bboxC.xmin + bboxC.width) * w)
            y2 = int((bboxC.ymin + bboxC.height) * h)
            faces.append((x1, y1, x2, y2))
    return faces



def estimate_distance(face_box):
    _, _, w, h = face_box
    face_size = (w + h) / 2
    reference_size = 150
    return max(1.0, reference_size / face_size)
