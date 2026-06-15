import { useState, useEffect, useRef } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import api from '../services/api';
import toast from 'react-hot-toast';

const FaceVerification = ({ registrationPhotoUrl, touristId }) => {
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [distance, setDistance] = useState(null);
  const [cameraOn, setCameraOn] = useState(false);
  const webcamRef = useRef(null);
  const registrationImageRef = useRef(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error('Error loading face-api models:', err);
    }
  };

  const captureRegistrationDescriptor = async () => {
    if (!registrationImageRef.current || !registrationPhotoUrl) {
      throw new Error('No registration photo available');
    }

    const img = registrationImageRef.current;
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in registration photo');
    }

    return detection.descriptor;
  };

  const captureWebcamDescriptor = async () => {
    if (!webcamRef.current) {
      throw new Error('Webcam not available');
    }

    const imageSrc = webcamRef.current.getScreenshot();
    const img = new Image();
    img.src = imageSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      throw new Error('No face detected in webcam feed');
    }

    return detection.descriptor;
  };

  const calculateEuclideanDistance = (descriptor1, descriptor2) => {
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    return Math.sqrt(sum);
  };

  const handleVerify = async () => {
    if (!modelsLoaded) {
      return;
    }

    setLoading(true);
    setResult(null);
    setDistance(null);

    try {
      const regDetection = await faceapi.detectSingleFace(registrationImageRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();

      const webcamDetection = await faceapi.detectSingleFace(webcamRef.current.video)
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!regDetection || !webcamDetection) {
        setResult('no_face');
        setLoading(false);
        return;
      }

      const dist = faceapi.euclideanDistance(regDetection.descriptor, webcamDetection.descriptor);
      setDistance(dist.toFixed(3));

      if (dist < 0.5) {
        setResult('verified');
        toast.success('Identity Verified', {
          duration: 3000,
          position: 'top-center',
        });
      } else {
        setResult('failed');
        toast.error('Face Not Matched - Wrong person', {
          duration: 5000,
          position: 'top-center',
        });

        // Create fraud attempt incident
        await api.post('/incidents', {
          tourist_id: touristId,
          type: 'fraud_attempt',
          risk_score: 100,
          status: 'open',
          ai_message: 'Face verification failed. Possible identity fraud detected during check-in.',
          details: JSON.stringify({ face_distance: dist }),
        });
      }
    } catch (err) {
      console.error('Face verification error:', err);
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  if (!modelsLoaded) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Check-in Verification</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading face recognition models...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Check-in Verification</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Registration Photo */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Registration Photo</h3>
          {registrationPhotoUrl ? (
            <img
              ref={registrationImageRef}
              src={registrationPhotoUrl}
              alt="Registration"
              className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-gray-200">
              <span className="text-gray-500">No registration photo</span>
            </div>
          )}
        </div>

        {/* Webcam Feed */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Live Camera</h3>
          <div className="w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
            {cameraOn ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                mirrored={true}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm text-center px-4">Camera is off - click Open Camera to start</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setCameraOn(!cameraOn)}
            className={`mt-3 w-full py-2 rounded-lg font-semibold transition-colors ${
              cameraOn
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {cameraOn ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Close Camera
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Open Camera
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Verify Button */}
      {cameraOn && (
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-blue-400"
        >
          {loading ? 'Verifying...' : 'Verify My Identity'}
        </button>
      )}

      {/* Verification Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result === 'verified'
            ? 'bg-green-100 text-green-700'
            : result === 'failed'
            ? 'bg-red-100 text-red-700'
            : result === 'no_face'
            ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'
        }`}>
          <div className="flex items-center gap-3">
            {result === 'verified' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {result === 'failed' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {result === 'no_face' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {result === 'error' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <div>
              <p className="font-semibold">
                {result === 'verified' && '✓ Identity Verified'}
                {result === 'failed' && '✗ Face Not Matched - You are not the registered tourist'}
                {result === 'no_face' && '⚠ No face detected - please look at the camera'}
                {result === 'error' && '⚠ Verification error - please try again'}
              </p>
              {distance && (
                <p className="text-sm">
                  Face distance: {distance}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceVerification;
