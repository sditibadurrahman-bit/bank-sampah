import React, { useState, useEffect } from 'react';
import { Save, QrCode } from 'lucide-react';
import Receipt from '../../components/Receipt';
import QrScanner from '../../components/QrScanner';
import { collection, onSnapshot, query, where, getDocs, addDoc, updateDoc, doc, increment } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { User, HargaSampah } from '../../lib/mockDb';

export default function SetoranSampah() {
  const [users, setUsers] = useState<User[]>([]);
  const [jenisSampah, setJenisSampah] = useState<HargaSampah[]>([]);
  
  const [userId, setUserId] = useState('');
  const [sampahId, setSampahId] = useState('');
  const [weight, setWeight] = useState('');
  
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    // Listen to users
    const qUsers = query(collection(firestore, 'users'), where('role', '==', 'nasabah'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const uData: User[] = [];
      snap.forEach(doc => {
        const u = { id: doc.id, ...doc.data() } as User;
        if (u.isActive) {
          uData.push(u);
        }
      });
      setUsers(uData);
    }, err => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Listen to hargaSampah
    const unsubHarga = onSnapshot(collection(firestore, 'hargaSampah'), (snap) => {
      const hData: HargaSampah[] = [];
      snap.forEach(doc => {
        hData.push({ id: doc.id, ...doc.data() } as HargaSampah);
      });
      setJenisSampah(hData.sort((a,b) => a.name.localeCompare(b.name)));
    }, err => handleFirestoreError(err, OperationType.LIST, 'hargaSampah'));

    return () => {
      unsubUsers();
      unsubHarga();
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const selectedSampah = jenisSampah.find(s => s.id === sampahId);
  const subtotal = selectedSampah && weight ? selectedSampah.pricePerKg * parseFloat(weight) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !sampahId || !weight || parseFloat(weight) <= 0) return;

    const selectedUser = users.find(u => u.id === userId);
    if (!selectedUser || !selectedSampah) return;

    setIsSubmitting(true);
    try {
      // 1. Tambah Setoran
      const newSetoranDoc = await addDoc(collection(firestore, 'setoran'), {
        userId,
        sampahId,
        weight: parseFloat(weight),
        pricePerKg: selectedSampah.pricePerKg,
        subtotal,
        date: new Date().toISOString()
      });

      // 2. Update Saldo Nasabah
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        balance: increment(subtotal)
      });

      setReceiptData({
        type: 'Setoran Sampah',
        transactionId: newSetoranDoc.id,
        date: new Date().toISOString(),
        entityName: selectedUser.name,
        entityId: selectedUser.id,
        items: [
          { label: 'Jenis Sampah', value: selectedSampah.name },
          { label: 'Harga / Kg', value: formatCurrency(selectedSampah.pricePerKg) },
          { label: 'Berat', value: `${weight} Kg` }
        ],
        total: subtotal
      });
      setShowReceipt(true);

      setUserId('');
      setSampahId('');
      setWeight('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'setoran/users');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Input Setoran Sampah Baru</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Nasabah (Aktif)</label>
            <div className="mt-1 flex space-x-2">
              <select
                required
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">-- Pilih Nasabah --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.id} - {u.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowScanner(true)}
                className="flex items-center justify-center px-4 py-3 border border-emerald-600 rounded-lg shadow-sm text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 shrink-0 transition-colors"
                title="Scan QR Nasabah"
              >
                <QrCode className="w-5 h-5 mr-0 sm:mr-2" />
                <span className="hidden sm:inline font-medium">Scan QR</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jenis Sampah</label>
              <select
                required
                value={sampahId}
                onChange={(e) => setSampahId(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              >
                <option value="">-- Pilih Jenis Sampah --</option>
                {jenisSampah.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({formatCurrency(s.pricePerKg)}/Kg)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Berat (Kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                placeholder="Contoh: 1.5"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Harga per Kg</span>
              <span className="font-semibold text-gray-900">{formatCurrency(selectedSampah?.pricePerKg || 0)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">Total Saldo Masuk</span>
              <span className="text-2xl font-bold text-emerald-600">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
               <>
                 <Save className="w-5 h-5 mr-2" />
                 Simpan Setoran
               </>
            )}
          </button>
        </form>
      </div>

      {showScanner && (
        <QrScanner
          onScan={(decodedText) => {
            // Check if scanned user exists
            const scannedUser = users.find(u => u.id === decodedText);
            if (scannedUser) {
              setUserId(scannedUser.id);
            }
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}

      {showReceipt && receiptData && (
        <Receipt 
          {...receiptData} 
          onClose={() => {
            setShowReceipt(false);
            setReceiptData(null);
          }} 
        />
      )}
    </div>
  );
}
