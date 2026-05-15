import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(window.location.search);
  const reason = queryParams.get('reason');
  const isRevoked = reason === 'revoked';

  const { currentUser, appUser } = useAuth();

  // If already fully logged in and profile exists, redirect
  React.useEffect(() => {
    if (currentUser && appUser) {
      if (!appUser.isActive) {
        auth.signOut();
        return;
      }
      if (appUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/nasabah');
      }
    } else if (currentUser && !appUser) {
        navigate('/register');
    }
  }, [currentUser, appUser, navigate]);


  const handleGoogleLogin = async () => {
    setError('');
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      // Required to display Google account selector on every login for UX
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      // Wait for the AuthContext to pick up the user and redirect via the useEffect
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login dibatalkan.');
      } else {
        setError(err.message || 'Gagal login menggunakan Google.');
        handleFirestoreError(err, OperationType.GET, null);
      }
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-emerald-500 bg-emerald-100 w-20 h-20 rounded-full items-center mx-auto shadow-sm">
          <Leaf className="w-10 h-10" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-800">
          Bank Sampah
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Masuk ke akun Anda
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-12 border border-slate-100">
          
          {isRevoked && !error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-md mb-4">
              Akun Anda belum disetujui atau telah dinonaktifkan. Silakan hubungi Admin.
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-sm border border-slate-300 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50"
            >
              {isLoggingIn ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Lanjutkan dengan Google
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
