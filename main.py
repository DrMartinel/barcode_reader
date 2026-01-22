from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import io
import numpy as np
from PIL import Image
import cv2
from pyzbar.pyzbar import decode

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# 1. Load your model globally
model = YOLO("best.pt")

# Hardcoded Thresholds from your settings
CONF_THRESHOLD = 0.60
IOU_THRESHOLD = 0.45
MAX_AREA_PCT = 0.20  # 20% of image area

@app.get("/health")
async def health_check():
    return {"status": "ok"}

def decode_barcode_from_crop(crop_image):
    """
    Attempts to decode a barcode from a cropped image.
    Returns the barcode data or None if not found.
    """
    try:
        # Convert PIL Image to numpy array if needed
        if isinstance(crop_image, Image.Image):
            crop_array = np.array(crop_image)
        else:
            crop_array = crop_image
        
        # Convert RGB to grayscale for better barcode detection
        if len(crop_array.shape) == 3:
            gray = cv2.cvtColor(crop_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = crop_array
        
        # Decode barcodes
        decoded_objects = decode(gray)
        
        if decoded_objects:
            # Return the first barcode found
            barcode_data = decoded_objects[0].data.decode('utf-8')
            barcode_type = decoded_objects[0].type
            return {
                "barcode_number": barcode_data,
                "barcode_type": barcode_type
            }
    except Exception as e:
        print(f"Error decoding barcode: {e}")
    
    return None

@app.post("/detect")
async def detect_barcode(file: UploadFile = File(...)):
    """
    Receives an image and returns filtered detections with barcode numbers.
    """
    # 2. Read and convert the image
    request_content = await file.read()
    img = Image.open(io.BytesIO(request_content)).convert("RGB")
    
    # 3. Run Inference with fixed YOLO parameters
    # The 'conf' and 'iou' are now set at the API level
    results = model.predict(
        source=img, 
        conf=CONF_THRESHOLD, 
        iou=IOU_THRESHOLD
    )
    
    detections = []
    for r in results:
        # 4. Manual Post-Processing for Fixed Max Box Area
        boxes = r.boxes
        for i, box in enumerate(boxes):
            # Calculate normalized area (width * height)
            w_norm = box.xywhn[0][2].item()
            h_norm = box.xywhn[0][3].item()
            area_pct = w_norm * h_norm
            
            # Apply hardcoded area filter
            if area_pct < MAX_AREA_PCT:
                # Get bounding box coordinates
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                
                # Crop the barcode region from the image
                cropped_barcode = img.crop((int(x1), int(y1), int(x2), int(y2)))
                
                # Attempt to decode the barcode
                barcode_info = decode_barcode_from_crop(cropped_barcode)
                
                detection = {
                    "bbox": [x1, y1, x2, y2],
                    "confidence": round(float(box.conf), 3),
                    "area_pct": round(area_pct * 100, 2),
                    "label": "barcode",
                    "barcode_data": barcode_info
                }
                
                detections.append(detection)
            
    return {
        "count": len(detections),
        "detections": detections,
        "applied_thresholds": {
            "confidence": CONF_THRESHOLD,
            "iou": IOU_THRESHOLD,
            "max_area_filter": MAX_AREA_PCT
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)