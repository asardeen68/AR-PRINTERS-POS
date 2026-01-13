import React, { useState } from 'react';
import { Printer, Lock, ArrowRight } from 'lucide-react';

interface LoginViewProps {
  onLogin: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple authentication for local POS
    // In a real scenario, this would check against a secure hash or backend
    if (password === '1234') {
      onLogin();
    } else {
      setError('Invalid Access Code. Try "1234"');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="bg-cyan-600 p-8 text-center">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Printer size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AR PRINTERS</h1>
          <p className="text-cyan-100 text-sm mt-1">Point of Sale System</p>
        </div>
        
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Administrator</label>
              <input 
                type="text" 
                value="Mohamed Asarudeen"
                disabled
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-medium cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Access PIN / Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Enter PIN"
                  className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold shadow-lg transform transition hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              Access System <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              System status: <span className="text-green-500 font-medium">● Local Database Active</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};