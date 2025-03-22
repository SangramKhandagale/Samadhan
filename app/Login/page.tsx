"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Image from 'next/image';

const App: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Save phone number to localStorage
    localStorage.setItem('userPhoneNumber', phoneNumber);
    
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to the FaceAuth page
      router.push('/FaceAuth');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000B18] to-[#001F3F]">
      <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url('https://public.readdy.ai/ai/img_res/a9ad5c47ed0c9f88469874c466b9ddb2.jpg')`,
        opacity: 0.2
      }}></div>

      <header className="relative bg-black/30 backdrop-blur-md border-b border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <i className="fas fa-cube text-3xl text-cyan-400"></i>
            <span className="text-cyan-400 text-xl font-bold tracking-wider">Samadhan</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-white/80 hover:text-cyan-400 transition-colors cursor-pointer">Home</a>
            <a href="#" className="text-white/80 hover:text-cyan-400 transition-colors cursor-pointer">Services</a>
            <a href="#" className="text-white/80 hover:text-cyan-400 transition-colors cursor-pointer">Support</a>
            <a href="#" className="text-white/80 hover:text-cyan-400 transition-colors cursor-pointer">Contact</a>
          </nav>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-8">
            <div className="bg-cyan-500/10 backdrop-blur-sm px-6 py-2 rounded-full flex items-center border border-cyan-400/30">
              <i className="fas fa-shield-alt text-cyan-400 mr-2"></i>
              <span className="text-cyan-400 text-sm">Face Authentication Active</span>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-cyan-500/30 shadow-[0_0_50px_rgba(0,255,255,0.1)]">
            <div className="mb-8 text-center">
              <div className="relative w-20 h-20 mx-auto mb-4">
                <Image 
                  src="https://public.readdy.ai/ai/img_res/5036c688411a86060f03212aeb7c33b5.jpg"
                  alt="Security Emblem"
                  className="rounded-full"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Secure Access Portal</h1>
              <p className="text-cyan-400/80 text-sm">Two Factor Verification Enabled</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-fingerprint text-cyan-400/50"></i>
                </div>
                <input
                  type="tel"
                  className="w-full pl-10 pr-3 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-cyan-400 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-key text-cyan-400/50"></i>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3 bg-black/30 border border-cyan-500/30 rounded-lg text-cyan-400 placeholder-cyan-400/50 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-cyan-400/50`}></i>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-cyan-400 rounded border-cyan-500/30 bg-black/30"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="ml-2 text-sm text-cyan-400/80">Remember me</span>
                </label>
                <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300 cursor-pointer">Reset Access</a>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 transition-all duration-300 cursor-pointer whitespace-nowrap"
                disabled={isLoading}
              >
                {isLoading ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-center border border-cyan-500/30">
              <i className="fas fa-microchip text-2xl text-cyan-400 mb-2"></i>
              <p className="text-xs text-cyan-400/80">Quantum Authentication</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-center border border-cyan-500/30">
              <i className="fas fa-brain text-2xl text-cyan-400 mb-2"></i>
              <p className="text-xs text-cyan-400/80">Neural Security</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 text-center border border-cyan-500/30">
              <i className="fas fa-network-wired text-2xl text-cyan-400 mb-2"></i>
              <p className="text-xs text-cyan-400/80">Blockchain Protected</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative bg-black/30 backdrop-blur-md mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-cyan-400 font-semibold mb-4">Neural Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">AI Assistant</a></li>
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">Quantum Help</a></li>
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">Security Protocol</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-cyan-400 font-semibold mb-4">Legal Matrix</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">Data Protocol</a></li>
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">Service Agreement</a></li>
                <li><a href="#" className="text-white/80 hover:text-cyan-400 text-sm cursor-pointer">Neural Compliance</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-cyan-400 font-semibold mb-4">Security Protocols</h3>
              <div className="flex space-x-4">
                <i className="fas fa-shield-virus text-3xl text-cyan-400/50"></i>
                <i className="fas fa-fingerprint text-3xl text-cyan-400/50"></i>
                <i className="fas fa-network-wired text-3xl text-cyan-400/50"></i>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-cyan-500/20 text-center">
            <p className="text-cyan-400/80 text-sm">© 2025 Quantum Bank. Secured by Neural Network v4.2</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;