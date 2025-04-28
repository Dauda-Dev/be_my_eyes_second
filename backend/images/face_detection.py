
import cv2

face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

def detect_faces(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5)
    return faces

def estimate_distance(face_box):
    _, _, w, h = face_box
    face_size = (w + h) / 2
    reference_size = 150
    return max(1.0, reference_size / face_size)
