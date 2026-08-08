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
  const [cameraReady, setCameraReady] = useState(false);
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

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1C1917]">Check-in Verification</h2>
        {!modelsLoaded && (
          <div className="flex items-center gap-2 text-xs text-[#A8A29E]">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1B4332]"></div>
            <span>Loading AI models...</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Registration Photo */}
        <div>
          <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide mb-2">Registration Photo</h3>
          {registrationPhotoUrl ? (
            <img
              ref={registrationImageRef}
              src={registrationPhotoUrl}
              alt="Registration"
              className="w-full h-64 object-cover rounded-xl border border-[#E7E5E4]"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="w-full h-64 bg-stone-100 rounded-xl border border-[#E7E5E4] flex items-center justify-center">
              <span className="text-[#78716C]">No registration photo</span>
            </div>
          )}
        </div>

        {/* Webcam Feed */}
        <div>
          <h3 className="text-sm font-medium text-[#A8A29E] uppercase tracking-wide mb-2">Live Camera</h3>
          <div className="w-full h-64 rounded-xl overflow-hidden border border-[#E7E5E4]">
            {cameraOn ? (
              <>
                {!cameraReady && (
                  <div className="flex items-center justify-center h-full bg-stone-100">
                    <p className="text-stone-500 text-sm">Starting camera...</p>
                  </div>
                )}
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  screenshotQuality={0.6}
                  videoConstraints={{
                    width: 640,
                    height: 480,
                    facingMode: 'user'
                  }}
                  onUserMedia={() => setCameraReady(true)}
                  onUserMediaError={(err) => console.error('Camera error:', err)}
                  className="w-full h-full object-cover"
                  mirrored={true}
                  style={{ display: cameraReady ? 'block' : 'none' }}
                />
              </>
            ) : (
              <div className="w-full h-full bg-stone-50 flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-[#A8A29E] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-[#78716C] text-sm text-center px-4">Camera is off - click Open Camera to start</p>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setCameraOn(!cameraOn);
              if (!cameraOn) {
                setCameraReady(false);
              }
            }}
            disabled={!modelsLoaded}
            className={`mt-3 w-full py-2 rounded-lg font-semibold transition-all ${
              cameraOn
                ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
                : 'bg-[#1B4332] text-white hover:bg-[#14532D]'
            } disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed`}
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
          disabled={loading || !modelsLoaded}
          className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-semibold hover:bg-[#14532D] transition-all disabled:bg-stone-300 disabled:text-stone-500 disabled:cursor-not-allowed"
        >
          {loading ? 'Verifying...' : 'Verify My Identity'}
        </button>
      )}

      {/* Verification Result */}
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result === 'verified'
            ? 'bg-[#D1FAE5] text-[#16A34A]'
            : result === 'failed'
            ? 'bg-[#FEE2E2] text-[#DC2626]'
            : result === 'no_face'
            ? 'bg-[#FEF3C7] text-[#D97706]'
            : 'bg-[#FEE2E2] text-[#DC2626]'
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
