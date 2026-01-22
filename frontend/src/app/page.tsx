'use client';

import { useState, useRef } from 'react';
import axios from 'axios';

interface BarcodeData {
  barcode_number: string;
  barcode_type: string;
}

interface Detection {
  bbox: number[];
  confidence: number;
  area_pct: number;
  label: string;
  barcode_data: BarcodeData | null;
}

interface ApiResponse {
  count: number;
  detections: Detection[];
  applied_thresholds: {
    confidence: number;
    iou: number;
    max_area_filter: number;
  };
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to backend
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('Uploading to:', `${apiUrl}/detect`);
      
      const response = await axios.post<ApiResponse>(
        `${apiUrl}/detect`,
        formData
        // Don't set Content-Type header - let axios handle it
      );

      console.log('Response received:', response.data);
      setResult(response.data);
    } catch (err) {
      const errorMsg = axios.isAxiosError(err) 
        ? err.response?.data?.detail || err.message 
        : err instanceof Error ? err.message : 'An error occurred during detection';
      setError(errorMsg);
      console.error('Detection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('active');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('active');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('active');
    const files = e.dataTransfer.files;
    if (files.length > 0 && fileInputRef.current) {
      fileInputRef.current.files = files;
      handleFileSelect({
        target: { files } as any,
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-lg bg-white shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Barcode Detector
          </h1>
          <p className="text-gray-600 mb-8">
            Upload an image to detect barcodes and read their numbers
          </p>

          {/* Upload Section */}
          <div className="mb-8">
            <div
              className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-8l-3.172-3.172a4 4 0 00-5.656 0L28 20M8 40h32"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="mt-2 text-lg font-medium text-gray-700">
                Drag and drop your image here
              </p>
              <p className="text-sm text-gray-600">
                or click to select a file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Image Preview
              </h2>
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-96 mx-auto rounded-lg shadow"
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Processing image...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-lg font-semibold text-gray-900">
                  Found {result.count} barcode{result.count !== 1 ? 's' : ''}
                </p>
              </div>

              {result.detections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {result.detections.map((detection, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                    >
                      <div className="bg-gray-100 p-4">
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">Confidence:</span>{' '}
                            {(detection.confidence * 100).toFixed(1)}%
                          </p>
                          <p>
                            <span className="font-medium">Area:</span>{' '}
                            {detection.area_pct.toFixed(2)}%
                          </p>
                        </div>
                      </div>

                      {detection.barcode_data ? (
                        <div className="p-4 bg-green-50 border-t border-green-200">
                          <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">
                              Barcode Number
                            </p>
                            <p className="text-2xl font-bold text-green-700 font-mono break-all">
                              {detection.barcode_data.barcode_number}
                            </p>
                            <p className="text-xs text-gray-600 mt-2">
                              Type: {detection.barcode_data.barcode_type}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
                          <p className="text-center text-sm text-yellow-700">
                            Barcode detected but could not be decoded
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                  <p>No barcodes detected in this image.</p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Confidence Threshold:</span>{' '}
                  {result.applied_thresholds.confidence}
                </p>
                <p>
                  <span className="font-medium">IOU Threshold:</span>{' '}
                  {result.applied_thresholds.iou}
                </p>
                <p>
                  <span className="font-medium">Max Area Filter:</span>{' '}
                  {(result.applied_thresholds.max_area_filter * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
