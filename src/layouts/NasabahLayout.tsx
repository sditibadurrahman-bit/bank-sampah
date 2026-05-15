import { useState } from 'react';
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, ChevronLeft, Home, UserCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export default function NasabahLayout() {
  const { appUser, currentUser: firebaseUser, logout } = useAuth();
  const currentUser = appUser;
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!firebaseUser || !currentUser || currentUser.role !== 'nasabah') {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isDashboard = location.pathname === '/nasabah' || location.pathname === '/nasabah/';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16 watermark-bg">
      {/* Top Header */}
      <header className="bg-emerald-600 border-b border-emerald-700 px-4 py-4 sticky top-0 z-50 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          {!isDashboard && (
            <button 
              onClick={() => navigate('/nasabah')}
              className="p-2 -ml-2 text-emerald-50 hover:text-white hover:bg-emerald-700 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-xl font-bold text-white tracking-tight">
            {isDashboard ? 'Portal Nasabah' : location.pathname.split('/').pop()}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-semibold text-white">{currentUser.name}</p>
            <p className="text-xs text-emerald-100 font-mono">ID: {currentUser.id}</p>
          </div>
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="p-2 text-emerald-50 hover:text-white hover:bg-emerald-700 rounded-full transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 md:p-8 w-full max-w-7xl mx-auto">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 z-50 px-6 py-2 flex justify-around items-center pb-safe">
        <button 
          onClick={() => navigate('/nasabah')} 
          className={`flex flex-col items-center p-2 transition-colors ${
            location.pathname === '/nasabah' || location.pathname === '/nasabah/' 
            ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Home</span>
        </button>
        <button 
          onClick={() => navigate('/nasabah/profil')} 
          className={`flex flex-col items-center p-2 transition-colors ${
            location.pathname === '/nasabah/profil' 
            ? 'text-emerald-600' : 'text-gray-500 hover:text-emerald-500'
          }`}
        >
          <UserCircle className="w-6 h-6" />
          <span className="text-[10px] sm:text-xs mt-1 font-medium">Profil</span>
        </button>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Logout</h3>
              <p className="text-sm text-gray-500">
                Apakah Anda yakin ingin keluar dari akun ini?
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
