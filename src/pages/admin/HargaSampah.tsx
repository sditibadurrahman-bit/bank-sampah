import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import PasswordVerificationModal from '../../components/PasswordVerificationModal';
import { collection, onSnapshot, query, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { HargaSampah as HargaSampahType } from '../../lib/mockDb';

export default function HargaSampah() {
  const [harga, setHarga] = useState<HargaSampahType[]>([]);
  const [search, setSearch] = useState('');

  // Verification State
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingName, setPendingName] = useState<string | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    pricePerKg: ''
  });

  useEffect(() => {
    const q = query(collection(firestore, 'hargaSampah'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: HargaSampahType[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as HargaSampahType);
      });
      setHarga(data.sort((a,b) => a.name.localeCompare(b.name)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'hargaSampah');
    });

    return () => unsubscribe();
  }, []);

  const deleteHarga = (id: string, name: string) => {
    setPendingId(id);
    setPendingName(name);
    setIsVerifyOpen(true);
  };

  const handleVerifiedDelete = async () => {
    if (pendingId) {
      try {
        await deleteDoc(doc(firestore, 'hargaSampah', pendingId));
        setIsVerifyOpen(false);
        setPendingId(null);
        setPendingName(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'hargaSampah');
      }
    }
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData({ code: '', name: '', category: '', pricePerKg: '' });
    setIsFormOpen(true);
  };

  const openEditForm = (item: HargaSampahType) => {
    setEditingId(item.id);
    setFormData({
      code: item.code,
      name: item.name,
      category: item.category,
      pricePerKg: item.pricePerKg.toString()
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        category: formData.category,
        pricePerKg: Number(formData.pricePerKg),
        lastUpdate: new Date().toISOString()
      };

      if (editingId) {
        // Edit existing
        await updateDoc(doc(firestore, 'hargaSampah', editingId), payload);
      } else {
        // Add new
        await addDoc(collection(firestore, 'hargaSampah'), payload);
      }
      setIsFormOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'hargaSampah');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = harga.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.category.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Cari jenis atau kategori sampah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={openAddForm}
          className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition xl:w-auto w-full shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Harga
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 tracking-wider">
            <tr>
              <th className="px-6 py-4 font-semibold">Kode</th>
              <th className="px-6 py-4 font-semibold">Nama Sampah</th>
              <th className="px-6 py-4 font-semibold">Kategori</th>
              <th className="px-6 py-4 font-semibold">Harga / Kg</th>
              <th className="px-6 py-4 font-semibold">Terakhir Update</th>
              <th className="px-6 py-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map(h => (
                <tr key={h.id} className="bg-white border-b border-slate-50 hover:bg-emerald-50/30 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-500">{h.code}</td>
                  <td className="px-6 py-4 font-semibold text-slate-800">{h.name}</td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{h.category}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 font-mono tracking-tight">{formatCurrency(h.pricePerKg)}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm font-medium">{new Date(h.lastUpdate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditForm(h)}
                        className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => deleteHarga(h.id, h.name)}
                        className="text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data harga sampah ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-6 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">
                {editingId ? 'Edit Harga Sampah' : 'Tambah Harga Sampah'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kode Sampah</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                  placeholder="Misal: PLT02"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sampah</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                  placeholder="Misal: Botol Plastik"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                >
                  <option value="">Pilih Kategori</option>
                  <option value="Plastik">Plastik</option>
                  <option value="Kertas">Kertas</option>
                  <option value="Logam">Logam / Besi</option>
                  <option value="Kaca">Kaca</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Minyak Jelantah">Minyak Jelantah</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Harga per Kg (Rp)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.pricePerKg}
                  onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 text-slate-800 font-mono"
                  placeholder="0"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PasswordVerificationModal 
        isOpen={isVerifyOpen}
        onClose={() => setIsVerifyOpen(false)}
        onVerified={handleVerifiedDelete}
        title="Hapus Data Sampah"
        description={`Konfirmasi penghapusan data ${pendingName}. Tindakan ini sensitif dan tidak dapat dibatalkan.`}
      />
    </div>
  );
}
