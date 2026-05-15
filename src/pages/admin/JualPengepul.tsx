import React, { useState, useEffect } from 'react';
import { Save, Printer } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { HargaSampah, Penjualan } from '../../lib/mockDb';

export default function JualPengepul() {
  const [jenisSampah, setJenisSampah] = useState<HargaSampah[]>([]);
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [pengepulName, setPengepulName] = useState('');
  const [sampahId, setSampahId] = useState('');
  const [weight, setWeight] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [success, setSuccess] = useState('');

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    // Listen to hargaSampah
    const unsubHarga = onSnapshot(collection(firestore, 'hargaSampah'), (snap) => {
      const hData: HargaSampah[] = [];
      snap.forEach(doc => {
        hData.push({ id: doc.id, ...doc.data() } as HargaSampah);
      });
      setJenisSampah(hData.sort((a,b) => a.name.localeCompare(b.name)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'hargaSampah'));

    // Listen to penjualan
    const unsubPenjualan = onSnapshot(collection(firestore, 'penjualan'), (snap) => {
      const pData: Penjualan[] = [];
      snap.forEach(doc => {
        pData.push({ id: doc.id, ...doc.data() } as Penjualan);
      });
      setPenjualan(pData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, err => handleFirestoreError(err, OperationType.LIST, 'penjualan'));

    return () => {
      unsubHarga();
      unsubPenjualan();
    };
  }, []);

  const subtotal = weight && pricePerKg ? parseFloat(weight) * parseFloat(pricePerKg) : 0;

  const handleShowReceipt = (p: Penjualan, sampahName: string) => {
    setReceiptData({
      type: 'Jual Pengepul',
      transactionId: p.id,
      date: p.date,
      entityName: p.pengepulName,
      items: [
        { label: 'Jenis Sampah', value: sampahName },
        { label: 'Harga Jual / Kg', value: formatCurrency(p.pricePerKg) },
        { label: 'Berat Total', value: `${p.weight} Kg` }
      ],
      total: p.total
    });
    setShowReceipt(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengepulName || !sampahId || !weight || !pricePerKg) return;

    setIsSubmitting(true);
    try {
      const payload = {
        pengepulName,
        sampahId,
        weight: parseFloat(weight),
        pricePerKg: parseFloat(pricePerKg),
        total: subtotal,
        date: new Date().toISOString()
      };

      const docRef = await addDoc(collection(firestore, 'penjualan'), payload);

      const sampah = jenisSampah.find(s => s.id === sampahId);
      handleShowReceipt({ id: docRef.id, ...payload } as Penjualan, sampah?.name || 'Unknown');

      setPengepulName('');
      setSampahId('');
      setWeight('');
      setPricePerKg('');
      setSuccess('Penjualan ke pengepul berhasil disimpan!');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'penjualan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form Input */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Input Penjualan</h2>

          {success && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pengepul</label>
              <input
                type="text"
                required
                value={pengepulName}
                onChange={(e) => setPengepulName(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Sampah</label>
              <select
                required
                value={sampahId}
                onChange={(e) => setSampahId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">-- Pilih Jenis --</option>
                {jenisSampah.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berat Total (Kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual / Kg (Rp)</label>
              <input
                type="number"
                min="0"
                required
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>

            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 flex justify-between items-center">
              <span className="text-emerald-800 font-medium">Total</span>
              <span className="text-xl font-bold text-emerald-700">{formatCurrency(subtotal)}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* History Table */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Riwayat Penjualan</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Pengepul</th>
                  <th className="px-6 py-4">Sampah</th>
                  <th className="px-6 py-4">Berat</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {penjualan.length > 0 ? (
                  penjualan.map(p => {
                    const sampah = jenisSampah.find(s => s.id === p.sampahId);
                    return (
                      <tr key={p.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.pengepulName}</td>
                        <td className="px-6 py-4 text-gray-600">{sampah?.name}</td>
                        <td className="px-6 py-4">{p.weight} Kg</td>
                        <td className="px-6 py-4 font-bold text-indigo-600">{formatCurrency(p.total)}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleShowReceipt(p, sampah?.name || 'Unknown')}
                            className="inline-flex py-1.5 px-3 rounded-md text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <Printer className="w-4 h-4 mr-1" /> Struk
                          </button>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Belum ada riwayat penjualan pengepul.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showReceipt && receiptData && (
        <Receipt 
          {...receiptData} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}
