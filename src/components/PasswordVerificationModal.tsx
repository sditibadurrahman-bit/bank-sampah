import React, { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

interface PasswordVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  title?: string;
  description?: string;
}

export default function PasswordVerificationModal({
  isOpen,
  onClose,
  onVerified,
  title = "Verifikasi Keamanan",
  description = "Silakan ketik 'SETUJU' untuk melanjutkan tindakan ini."
}: PasswordVerificationModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmation === 'SETUJU') {
      setConfirmation('');
      setError('');
      onVerified();
    } else {
      setError("Kata kunci salah. Silakan ketik 'SETUJU'.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
              <X className="w-6 h-6" />
            </button>
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {description}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Ketik "SETUJU"
              </label>
              <input
                type="text"
                required
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-800"
                placeholder="SETUJU"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
              {error && <p className="text-rose-500 text-xs mt-2 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-[0.98]"
            >
              Verifikasi & Lanjutkan
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-slate-400 font-medium text-sm hover:text-slate-600 transition-colors"
            >
              Batalkan
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
