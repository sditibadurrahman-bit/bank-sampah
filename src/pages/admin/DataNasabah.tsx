import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { User } from '../../lib/mockDb';

export default function DataNasabah() {
  const [nasabah, setNasabah] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'nasabah'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((doc) => {
        users.push(doc.data() as User);
      });
      setNasabah(users);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (user: User) => {
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        isActive: !user.isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.id}`);
    }
  };

  const filteredData = nasabah.filter(n => 
    n.name.toLowerCase().includes(search.toLowerCase()) || 
    n.id.toLowerCase().includes(search.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm text-slate-800 shadow-sm transition-shadow hover:shadow-md"
            placeholder="Cari nama atau ID nasabah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">ID</th>
              <th className="px-6 py-4 font-semibold">Nasabah</th>
              <th className="px-6 py-4 font-semibold">Kontak</th>
              <th className="px-6 py-4 font-semibold">Saldo</th>
              <th className="px-6 py-4 font-semibold">Status (Klik untuk ubah)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Memuat data...
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map(n => (
                <tr key={n.id} className="bg-white border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">
                    <span className="block truncate max-w-[100px]" title={n.id}>{n.id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{n.name}</div>
                    <div className="text-slate-400 text-xs font-medium mt-0.5">{new Date(n.joinDate).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-700 text-sm font-medium">{n.phone}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{n.email}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono tracking-tight">
                    {formatCurrency(n.balance)}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(n)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors shadow-sm cursor-pointer ${n.isActive ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 hover:shadow-md' : 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:shadow-md'}`}
                      title={n.isActive ? "Nonaktifkan Nasabah" : "Aktifkan Nasabah"}
                    >
                      {n.isActive ? <CheckCircle className="w-4 h-4 mr-1.5"/> : <XCircle className="w-4 h-4 mr-1.5"/>}
                      {n.isActive ? 'Aktif' : 'Menunggu Persetujuan'}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data nasabah ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
