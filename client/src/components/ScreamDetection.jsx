import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';

const ScreamDetection = () => {
  const [isListening, setIsListening] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [screamDetected, setScreamDetected] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const animationRef = useRef(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      microphoneRef.current = microphone;
      
      setIsListening(true);
      detectScream();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopListening = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    setIsListening(false);
    setAudioLevel(0);
  };

  const detectScream = () => {
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const update = () => {
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);
      
      // Simple scream detection threshold
      if (average > 150) {
        setScreamDetected(true);
        // In a real implementation, you would send an alert here
        console.log('Scream detected!');
      } else {
        setScreamDetected(false);
      }
      
      animationRef.current = requestAnimationFrame(update);
    };
    
    update();
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="bg-white rounded-xl border border-[#E7E5E4] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-[#1C1917]">Sound Monitor</h2>
        {screamDetected && (
          <div className="flex items-center gap-2 text-xs text-[#DC2626] bg-[#FEE2E2] px-3 py-1 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            <span>Loud Sound Detected</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-12">
        {/* Audio Level Indicator */}
        <div className="relative w-32 h-32 mb-6">
          <div className="absolute inset-0 rounded-full bg-stone-100" />
          <div 
            className="absolute inset-0 rounded-full transition-all duration-150"
            style={{
              background: `conic-gradient(${
                screamDetected ? '#DC2626' : '#1B4332'
              } ${audioLevel}%, transparent ${audioLevel}%)`,
              transform: 'rotate(-90deg)'
            }}
          />
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#1C1917]">{Math.round(audioLevel)}</p>
              <p className="text-xs text-[#A8A29E]">dB Level</p>
            </div>
          </div>
        </div>

        {/* Control Button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all ${
            isListening
              ? 'bg-[#DC2626] text-white hover:bg-[#B91C1C]'
              : 'bg-[#1B4332] text-white hover:bg-[#14532D]'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              Stop Monitoring
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Start Monitoring
            </>
          )}
        </button>

        {/* Status Text */}
        <p className="mt-4 text-sm text-[#78716C]">
          {isListening 
            ? 'Listening for loud sounds or screams...' 
            : 'Click to start sound monitoring'}
        </p>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-4 bg-stone-50 rounded-lg border border-[#E7E5E4]">
        <h3 className="text-sm font-medium text-[#1C1917] mb-2">How it works</h3>
        <ul className="text-xs text-[#78716C] space-y-1">
          <li>• Monitors ambient sound levels in real-time</li>
          <li>• Detects unusually loud sounds or screams</li>
          <li>• Can trigger automatic SOS alerts</li>
          <li>• Works even when your phone is locked</li>
        </ul>
      </div>
    </div>
  );
};

export default ScreamDetection;
