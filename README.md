# Barcode Detector Frontend

A modern Next.js frontend for the Barcode Detector application. Upload images to detect barcodes and read their numbers in real-time.

## Features

- 🖼️ Drag-and-drop image upload
- 📊 Real-time barcode detection and decoding
- 📱 Responsive design with Tailwind CSS
- 🎯 Displays barcode numbers, types, and detection confidence
- ⚡ Fast image processing with backend API

## Prerequisites

- Node.js 18+ (for local development)
- Docker & Docker Compose (for containerized deployment)

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   Create `.env.local` file:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Docker Deployment (published images)

Run the stack using the public images from Docker Hub:

```bash
docker compose up -d
```

- Images pulled: `drmartinel/barcode-detector-api:v1` and `drmartinel/barcode-detector-client:v1`
- API listens on port 8080, frontend on port 3000
- Detections are persisted to `./detections` (bind-mounted into the API container)

### Environment Variables (Docker)

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://barcode-api:8080`)
- `MODEL_PATH`: Path to the model file inside the API container (default: `best.pt`)

The frontend will be available at [http://localhost:3000](http://localhost:3000)

## How to Use

1. **Upload an Image**: Click the upload area or drag and drop an image
2. **View Results**: The app will display:
   - Number of barcodes detected
   - Barcode number and type for each detection
   - Confidence level and area percentage
3. **Applied Thresholds**: See the detection parameters used

## Project Structure

```
frontend/
├── src/
│   └── app/
│       ├── layout.tsx      # Root layout component
│       ├── page.tsx        # Main barcode detector page
│       └── globals.css     # Global styles
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies
└── Dockerfile              # Docker image definition
```

## API Integration

The frontend communicates with the backend API at the `/detect` endpoint:

- **Endpoint**: `POST /detect`
- **Request**: Multipart form data with image file
- **Response**:
  ```json
  {
    "count": 2,
    "detections": [
      {
        "bbox": [x1, y1, x2, y2],
        "confidence": 0.95,
        "area_pct": 5.23,
        "label": "barcode",
        "barcode_data": {
          "barcode_number": "1234567890",
          "barcode_type": "CODE128"
        }
      }
    ],
    "applied_thresholds": {...}
  }
  ```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **React 18** - UI library

## License

MIT
