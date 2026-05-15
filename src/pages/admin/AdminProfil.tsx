import React, { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Save, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminProfil() {
  const { appUser } = useAuth();
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (appUser) {
      setName(appUser.name || '');
      setPhone(appUser.phone || '');
      setAddress(appUser.address || '');
    }
  }, [appUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    
    setIsSubmitting(true);
    setSuccess('');

    try {
      const userRef = doc(firestore, 'users', appUser.id);
      await updateDoc(userRef, {
        name,
        phone,
        address,
        updatedAt: new Date().toISOString()
      });
      setSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${appUser.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!appUser) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="bg-slate-900 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-600 overflow-hidden">
                <img 
                   src={`https://api.dicebear.com/7.x/initials/svg?seed=${appUser.name}&backgroundColor=0f172a`}
                   alt="Avatar"
                   className="w-full h-full object-cover"
                 />
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-6 px-8 border-b border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900">{appUser.name}</h2>
          <p className="text-slate-600 font-medium capitalize">{appUser.role} Aktif</p>
          <p className="text-sm text-gray-500 mt-1">Bergabung sejak {new Date(appUser.joinDate).toLocaleDateString('id-ID')}</p>
        </div>

        <div className="p-8">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Edit Profil Admin</h3>
          
          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-lg text-sm bg-opacity-50">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-xs text-gray-400 font-normal">(Tidak dapat diubah)</span></label>
              <input
                type="email"
                disabled
                value={appUser.email}
                className="block w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg shadow-sm text-gray-500 sm:text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No. HP (WhatsApp)</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                rows={3}
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-800 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
