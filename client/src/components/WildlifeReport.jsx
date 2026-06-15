import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import api from '../services/api';
import toast from 'react-hot-toast';

const WildlifeReport = () => {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mode, setMode] = useState('camera'); // 'camera' or 'upload'
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleCapture = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setShowCamera(false);
  };

  const handleAnalyze = async () => {
    const imageToAnalyze = capturedImage || uploadedImage;
    if (!imageToAnalyze) return;

    setAnalyzing(true);
    setResult(null);

    try {
      let response;

      if (uploadedImage) {
        const formData = new FormData();
        formData.append('image', uploadedImage);
        response = await api.post('/wildlife/detect/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const base64Data = capturedImage.split(',')[1];
        response = await api.post('/wildlife/detect/camera', {
          image: base64Data,
        });
      }

      // Safely extract result
      const detectionResult = response?.data?.result;

      if (!detectionResult) {
        toast.error('No result returned from server. Please try again.');
        return;
      }

      setResult(detectionResult);

      // Only show warning toast if detected is explicitly true
      if (detectionResult.detected === true) {
        const animalName = detectionResult.animal || 'Unknown animal';
        toast.warning(`⚠️ ${animalName} detected! Stay safe.`, {
          duration: 5000,
          position: 'top-center',
        });
      } else {
        toast.success('No dangerous wildlife detected.', {
          duration: 3000,
          position: 'top-center',
        });
      }

    } catch (error) {
      // Only show error toast if it is a real network/server error
      if (error?.response || error?.request) {
        console.error('Error detecting wildlife:', error);
        toast.error('Failed to analyze image. Please try again.', {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        // Log silently — this was a JS error after successful response
        console.warn('Non-network error in handleAnalyze:', error.message);
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setCapturedImage(null);
    setUploadedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setShowCamera(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file); // Store File object for FormData
      setPreviewUrl(URL.createObjectURL(file)); // For image preview
    }
  };

  const handleClearUpload = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setResult(null);
    setShowCamera(true);
  };

  if (!showCamera && !capturedImage && !uploadedImage) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Report Wildlife Sighting</h2>
        <p className="text-gray-600 mb-4">
          Take a photo or upload an image of any suspicious wildlife to get AI-powered detection and safety advice.
        </p>
        
        {/* Mode Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'camera'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📷 Use Camera
          </button>
          <button
            onClick={() => setMode('upload')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
              mode === 'upload'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📁 Upload Photo
          </button>
        </div>

        {mode === 'camera' && (
          <button
            onClick={() => setShowCamera(true)}
            className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
          >
            📷 Open Camera
          </button>
        )}

        {mode === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors"
          >
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-600">Click to upload or drag and drop</p>
            <p className="text-gray-400 text-sm mt-1">Image files only</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </div>
    );
  }

  if (showCamera) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Report Wildlife Sighting</h2>
        <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200 mb-4">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            mirrored={true}
          />
        </div>
        <div className="flex gap-4">
          <button
            onClick={handleCapture}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Capture Photo
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Report Wildlife Sighting</h2>
      
      <div className="mb-4">
        <img
          src={capturedImage || previewUrl}
          alt={capturedImage ? 'Captured' : 'Uploaded'}
          className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
        />
      </div>

      {uploadedImage && !result && (
        <button
          onClick={handleClearUpload}
          className="w-full mb-4 bg-gray-500 text-white py-2 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
        >
          Clear Photo
        </button>
      )}

      {!result ? (
        <div className="flex gap-4">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex-1 bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors disabled:bg-orange-400"
          >
            {analyzing ? 'Analyzing...' : (uploadedImage ? 'Analyze Photo' : 'Analyze with AI')}
          </button>
          {!uploadedImage && (
            <button
              onClick={handleRetake}
              disabled={analyzing}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Retake Photo
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {result.detected ? (
            <div className="bg-red-100 border-2 border-red-300 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h3 className="text-xl font-bold text-red-700">
                  {result.animal} Detected!
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-red-700">
                  <span className="font-semibold">Danger Level:</span> {result.danger_level.toUpperCase()}
                </p>
                <p className="text-red-700">
                  <span className="font-semibold">Advice:</span> {result.advice}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-100 border-2 border-green-300 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h3 className="text-xl font-bold text-green-700">
                  Area Looks Clear
                </h3>
              </div>
              <p className="text-green-700">
                No dangerous wildlife detected in the image. Stay safe and continue monitoring your surroundings.
              </p>
            </div>
          )}
          
          <button
            onClick={handleReset}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};

export default WildlifeReport;
