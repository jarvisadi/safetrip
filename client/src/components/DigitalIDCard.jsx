import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

const DigitalIDCard = ({ touristData, onDownload }) => {
  const cardRef = useRef(null);

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `safetrip-id-${touristData.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      if (onDownload) onDownload();
    }
  };

  if (!touristData) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div
        ref={cardRef}
        className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 w-full max-w-md text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">SafeTrip</h2>
            <p className="text-blue-200 text-sm">Digital Tourist ID</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Photo and Info */}
        <div className="flex gap-4 mb-6">
          <div className="flex-shrink-0">
            {touristData.photoUrl ? (
              <img
                src={touristData.photoUrl}
                alt="Profile"
                className="w-24 h-24 rounded-lg object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-white/20 flex items-center justify-center border-2 border-white/30">
                <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{touristData.name}</h3>
            <p className="text-blue-200 text-sm mb-2">ID: {touristData.id}</p>
            <p className="text-blue-200 text-sm">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              {touristData.phone}
            </p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <p className="text-xs text-blue-200 mb-2 uppercase tracking-wide">Emergency Contact</p>
          <p className="font-semibold">{touristData.emergencyContactName}</p>
          <p className="text-blue-200 text-sm">{touristData.emergencyContactPhone}</p>
        </div>

        {/* QR Code */}
        <div className="flex items-center justify-between">
          <div className="bg-white p-2 rounded-lg">
            {touristData.qrCode ? (
              <QRCodeSVG value={touristData.qrCode} size={80} />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded" />
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-200">Scan for</p>
            <p className="text-sm font-semibold">Verification</p>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownload}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download ID Card
      </button>
    </div>
  );
};

export default DigitalIDCard;
