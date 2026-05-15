import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const { currentUser, appUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        navigate('/login');
      } else if (appUser) {
        if (appUser.role === 'admin') navigate('/admin');
        else navigate('/nasabah');
      } else {
        // Pre-fill name if available
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || ''
        }));
      }
    }
  }, [currentUser, appUser, loading, navigate]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      const isSuperAdmin = currentUser.email === 'sditibadurrahman@gmail.com';
      const userRef = doc(db, 'users', currentUser.uid);
      console.log('DEBUG: Registering user to Firestore...', currentUser.uid, formData);
      
      const userData = {
        id: currentUser.uid,
        name: formData.name,
        address: formData.address,
        phone: formData.phone,
        email: currentUser.email || '',
        role: isSuperAdmin ? 'admin' : 'nasabah',
        balance: 0,
        joinDate: new Date().toISOString(),
        isActive: isSuperAdmin ? true : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      console.log('DEBUG: User data payload:', userData);
      await setDoc(userRef, userData);
      console.log('DEBUG: Registration finished successfully!');
      
      if (isSuperAdmin) {
        setSuccess('Pendaftaran Admin berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => {
          navigate('/admin');
        }, 2000);
      } else {
        setSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu persetujuan Admin.');
        setTimeout(() => {
          // Force navigate to trigger protected route which will redirect to login?reason=revoked
          navigate('/login?reason=revoked');
        }, 3000);
      }
    } catch (err: any) {
      console.error(err);
      setError(`Gagal melengkapi profil. Silakan coba lagi. Error: ${err.message || String(err)}`);
      handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-emerald-500 bg-emerald-100 w-20 h-20 rounded-full items-center mx-auto shadow-sm">
          <Leaf className="w-10 h-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800">
          Lengkapi Profil Anda
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Mari wujudkan lingkungan bersih bersama kami
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-12 border border-slate-100">
          {success ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-md text-center">
              {success}
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow hover:shadow-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Alamat</label>
                <textarea
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow hover:shadow-md"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">No. HP (WhatsApp)</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-shadow hover:shadow-md"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 mt-2 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan & Daftar'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
