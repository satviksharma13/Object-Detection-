from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from supervision.draw.color import ColorPalette
from supervision.tools.detections import Detections, BoxAnnotator
import base64
import torch
import cv2
import numpy

app = Flask(__name__)
CORS(app, resources={r"/detect": {"origins": "http://localhost:5173"}})

@app.route('/detect', methods=['POST'])
def detect_file():
    file = None
    if 'file' in request.files:
        file = request.files['file']
    if file:
        conf = request.form.get('confidence')
        ovlp = request.form.get('overlap')
        conf = int(conf) if conf is not None else 40
        ovlp = int(ovlp) if ovlp is not None else 30

        try:
            frame = cv2.imread(file)
            result = model.predict(frame, conf=conf/100, iou=ovlp/100)
            print('prediction successfull.')
        except: 
            print('prediction unsuccessfull.')
            return jsonify({"OK" : False, "error" : "Detection unsuccessfull."}), 400
    
        outputtype = request.form.get('type')
        outputtype = int(outputtype) if outputtype is not None else 0
        classes = request.form.get('classes')
        classes = classes.split(',') if classes is not None else []
        classes = [cls.strip() for cls in classes]

        xyxys = result[0].boxes.xyxy.cpu().numpy()
        confidences = result[0].boxes.conf.cpu().numpy()
        class_ids = result[0].boxes.cls.cpu().numpy().astype(int)
        xyxy = []
        confidence = []
        class_id = []
        if len(classes):
            for i in range(len(class_ids)):
                if CLASS_NAMES_DICT[class_ids[i]] in classes:
                    xyxy.append(xyxys[i])
                    confidence.append(confidences[i])
                    class_id.append(class_ids[i])
        if(len(xyxy) == 0):
            xyxy = xyxys
            confidence = confidences
            class_id = class_ids
        detections = Detections(
                xyxy=numpy.array(xyxy).reshape(len(xyxy), 4),
                confidence=numpy.array(confidence).reshape(len(confidence)),
                class_id=numpy.array(class_id).reshape(len(class_id))
            )
        labels = [
            f"{CLASS_NAMES_DICT[class_id]} {confidence:0.2f}"
            for _, confidence, class_id, tracker_id in detections
        ]

        if outputtype:
            predictions = []
            for i in range(len(class_id)):
                prediction = {}
                prediction['x'] = str(xyxy[i][0])
                prediction['y'] = str(xyxy[i][1])
                prediction['width'] = str(xyxy[i][2])
                prediction['height'] = str(xyxy[i][3])
                prediction['confidence'] = str(confidence[i])
                prediction['class'] = CLASS_NAMES_DICT[class_ids[i]]
                prediction['class_id'] = str(class_id[i])
                predictions.append(prediction)
            return jsonify({"OK" : True, "message" : "Detection successfull.", "json" : {"predictions" : predictions}}), 200
        else:
            label = request.form.get('label')
            label = label if label is not None else True
            stroke = request.form.get('stroke')
            stroke = int(stroke) if stroke is not None else 2

            box_annotator = BoxAnnotator(color=ColorPalette(), thickness=stroke, text_thickness=1, text_scale=0.5)
            if label == 'false':
                labels = None
            frame = box_annotator.annotate(frame=frame, detections=detections,labels=labels)
            _, buffer = cv2.imencode('.jpg', frame)
            base64_image = base64.b64encode(buffer).decode('utf-8')
            return jsonify({"OK" : True, "message" : "Detection successfull.", "file" :base64_image}), 200
    return jsonify({"OK" : False, "error" : "Detection unsuccessfull."}), 400

if __name__ == '__main__':
    model = YOLO('yolov8x-2xhead.yaml', task="detect").load("yolov8x.pt")
    state_dict = torch.load("yolov8x_lp.pth")
    model.load_state_dict(state_dict, strict=False)
    CLASS_NAMES_DICT = {i: name for i, name in enumerate([
    'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
    'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
    'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
    'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
    'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
    'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
    'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
    'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
    'teddy bear', 'hair drier', 'toothbrush', 'face', 'helmet'
    ])}
    app.run(debug=True)
