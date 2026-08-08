import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, MapPin, Camera, MessageCircle, AlertTriangle, Zap, GitBranch, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  console.log('LandingPage rendering');
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-[#1B4332]" />
              <span className="text-2xl font-bold text-[#1B4332]">SafeTrip</span>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-[#1C1917] hover:text-[#1B4332] transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-[#1C1917] hover:text-[#1B4332] transition-colors">
                How it Works
              </button>
              <button onClick={() => scrollToSection('about')} className="text-[#1C1917] hover:text-[#1B4332] transition-colors">
                About
              </button>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/login')}
                className="hidden sm:block px-4 py-2 border-2 border-[#1B4332] text-[#1B4332] rounded-lg hover:bg-[#1B4332] hover:text-white transition-all"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-4 py-2 bg-[#1B4332] text-white rounded-lg hover:bg-[#163a2a] transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-[#FAFAF9] to-[#F5F5F0]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold text-[#1C1917] leading-[1.1]">
                Every Tourist<br />
                Deserves to Come<br />
                Home Safe
              </h1>
              
              <p className="text-xl text-[#6B7280] leading-relaxed max-w-lg">
                SafeTrip tracks your journey in real time, detects danger automatically using AI, 
                and alerts rescue teams — so your family never has to worry.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-[#1B4332] text-white rounded-xl hover:bg-[#163a2a] transition-all font-medium text-lg"
                >
                  Register as Tourist
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-4 border-2 border-[#E5E7EB] text-[#1C1917] rounded-xl hover:border-[#1B4332] transition-all font-medium text-lg"
                >
                  Admin Login
                </button>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#1B4332] to-[#2D5A4A] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">RS</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1C1917] text-lg">Rahul Sharma</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-green-600 font-medium">Safe ✓</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#F5F5F0] rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <MapPin className="w-5 h-5 text-[#1B4332]" />
                    <span className="text-sm font-medium text-[#1C1917]">Current Location</span>
                  </div>
                  <p className="text-sm text-[#6B7280]">Jim Corbett National Park, Zone 4</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">Updated 2 seconds ago</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <p className="font-bold text-[#1C1917]">4.2 km</p>
                    <p className="text-[#6B7280]">Distance</p>
                  </div>
                  <div className="h-8 w-px bg-[#E5E7EB]" />
                  <div className="text-center">
                    <p className="font-bold text-[#1C1917]">2h 15m</p>
                    <p className="text-[#6B7280]">Duration</p>
                  </div>
                  <div className="h-8 w-px bg-[#E5E7EB]" />
                  <div className="text-center">
                    <p className="font-bold text-green-600">Active</p>
                    <p className="text-[#6B7280]">Status</p>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#D97706]/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#1B4332]/10 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-white border-y border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#1B4332]" />
              <span className="font-semibold text-[#1C1917]">4 AI Models</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#1B4332]" />
              <span className="font-semibold text-[#1C1917]">Real-time Tracking</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#1B4332]" />
              <span className="font-semibold text-[#1C1917]">1-tap SOS</span>
            </div>
            <div className="hidden md:block h-6 w-px bg-[#E5E7EB]" />
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-[#1B4332]" />
              <span className="font-semibold text-[#1C1917]">Live Deployed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1C1917] mb-4">Built for Safety</h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Every feature designed to keep tourists protected in India's wilderness
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Live GPS Tracking</h3>
              <p className="text-[#6B7280] leading-relaxed">
                Real-time location updates every 10 seconds via WebSocket. Admins see every tourist on a live map.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <Camera className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Face Verification</h3>
              <p className="text-[#6B7280] leading-relaxed">
                FaceNet neural network verifies tourist identity at entry points. Prevents ID fraud instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Wildlife Detection</h3>
              <p className="text-[#6B7280] leading-relaxed">
                Upload a photo. Groq Vision AI detects dangerous animals and alerts nearby tourists.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <MessageCircle className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Safety Chatbot</h3>
              <p className="text-[#6B7280] leading-relaxed">
                Ask anything about trails, wildlife, or emergency contacts. AI answers from local knowledge base.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">One-tap SOS</h3>
              <p className="text-[#6B7280] leading-relaxed">
                Single button sends GPS location to authorities and family via SMS. Works even in low network.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-[#1B4332]" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Geo-fence Alerts</h3>
              <p className="text-[#6B7280] leading-relaxed">
                Admins draw danger zones. AI auto-alerts when tourists enter restricted areas.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#1C1917] mb-4">How It Works</h2>
            <p className="text-xl text-[#6B7280] max-w-2xl mx-auto">
              Three simple steps to complete safety coverage
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-[#FAFAF9] p-8 rounded-2xl">
                <div className="w-12 h-12 bg-[#1B4332] text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="text-xl font-bold text-[#1C1917] mb-3">Register & Get Digital ID</h3>
                <p className="text-[#6B7280] leading-relaxed">
                  Create your profile, upload photo, get a QR-coded digital ID card in seconds.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-[#E5E7EB]" />
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-[#FAFAF9] p-8 rounded-2xl">
                <div className="w-12 h-12 bg-[#1B4332] text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="text-xl font-bold text-[#1C1917] mb-3">Travel with AI Protection</h3>
                <p className="text-[#6B7280] leading-relaxed">
                  App silently tracks your location. AI monitors for danger in the background.
                </p>
              </div>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 border-t-2 border-dashed border-[#E5E7EB]" />
            </div>

            {/* Step 3 */}
            <div className="bg-[#FAFAF9] p-8 rounded-2xl">
              <div className="w-12 h-12 bg-[#1B4332] text-white rounded-full flex items-center justify-center font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-bold text-[#1C1917] mb-3">Help Reaches You Automatically</h3>
              <p className="text-[#6B7280] leading-relaxed">
                If something goes wrong, authorities are notified instantly — even if you can't press SOS.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-6 bg-[#1B4332]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Start Your Safe Journey Today
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join tourists, admins, and government officials already using SafeTrip
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-[#D97706] text-white rounded-xl hover:bg-[#B45309] transition-all font-medium text-lg"
            >
              Register Now
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-all font-medium text-lg"
            >
              View Live Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="py-12 px-6 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-[#1B4332]" />
                <span className="text-xl font-bold text-[#1B4332]">SafeTrip</span>
              </div>
              <p className="text-[#6B7280] text-sm">
                Keeping tourists safe across India
              </p>
            </div>

            {/* Center */}
            <div>
              <h4 className="font-semibold text-[#1C1917] mb-4">Quick Links</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('features')} className="block text-[#6B7280] hover:text-[#1B4332] transition-colors text-sm">
                  Features
                </button>
                <button onClick={() => navigate('/login')} className="block text-[#6B7280] hover:text-[#1B4332] transition-colors text-sm">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="block text-[#6B7280] hover:text-[#1B4332] transition-colors text-sm">
                  Register
                </button>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#6B7280] hover:text-[#1B4332] transition-colors text-sm">
                  <GitBranch className="w-4 h-4" />
                  GitHub
                </a>
              </div>
            </div>

            {/* Right */}
            <div>
              <h4 className="font-semibold text-[#1C1917] mb-4">About</h4>
              <p className="text-[#6B7280] text-sm leading-relaxed">
                Made with ❤️ by Aditya Kumar, IIIT Bhubaneswar
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#E5E7EB] text-center">
            <p className="text-[#9CA3AF] text-sm">
              © 2025 SafeTrip. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
