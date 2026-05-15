import { useState, useEffect } from 'react';
import { ArrowDownToLine, Printer } from 'lucide-react';
import Receipt from '../../components/Receipt';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Setoran, HargaSampah } from '../../lib/mockDb';

export default function RiwayatSetoran() {
  const { appUser } = useAuth();
  const currentUser = appUser;
  const [riwayat, setRiwayat] = useState<Setoran[]>([]);
  const [hargaData, setHargaData] = useState<Record<string, HargaSampah>>({});
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      const fetchData = async () => {
        try {
          // Fetch Harga Sampah
          const hargaSnap = await getDocs(collection(firestore, 'hargaSampah'));
          const hargaMap: Record<string, HargaSampah> = {};
          hargaSnap.forEach(h => {
            hargaMap[h.id] = h.data() as HargaSampah;
          });
          setHargaData(hargaMap);

          // Fetch My Setoran
          const setoranQ = query(collection(firestore, 'setoran'), where('userId', '==', currentUser.id));
          const setoranSnap = await getDocs(setoranQ);
          const mySetoran: Setoran[] = [];
          setoranSnap.forEach(doc => mySetoran.push({ id: doc.id, ...doc.data() } as Setoran));
          
          setRiwayat(mySetoran.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch(err) {
          handleFirestoreError(err, OperationType.GET, 'multiple');
        }
      };
      fetchData();
    }
  }, [currentUser?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const handleShowReceipt = (r: Setoran, sampahName: string) => {
    if (!currentUser) return;
    setReceiptData({
      type: 'Setoran Sampah',
      transactionId: r.id,
      date: r.date,
      entityName: currentUser.name,
      entityId: currentUser.id,
      items: [
        { label: 'Jenis Sampah', value: sampahName },
        { label: 'Harga / Kg', value: formatCurrency(r.pricePerKg) },
        { label: 'Berat', value: `${r.weight} Kg` }
      ],
      total: r.subtotal
    });
    setShowReceipt(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
          <ArrowDownToLine className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Riwayat Setoran Sampah</h2>
          <p className="text-sm text-gray-500">Tabel berisi daftar semua setoran yang pernah Anda lakukan</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4">Tanggal</th>
              <th className="px-6 py-4">ID Transaksi</th>
              <th className="px-6 py-4">Jenis Sampah</th>
              <th className="px-6 py-4">Berat (Kg)</th>
              <th className="px-6 py-4">Harga / Kg</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {riwayat.length > 0 ? (
              riwayat.map(r => {
                const sampah = hargaData[r.sampahId];
                const sampahName = sampah?.name || 'Unknown';
                return (
                  <tr key={r.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-600">{new Date(r.date).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{r.id}</td>
                    <td className="px-6 py-4">{sampahName}</td>
                    <td className="px-6 py-4">{r.weight}</td>
                    <td className="px-6 py-4">{formatCurrency(r.pricePerKg)}</td>
                    <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(r.subtotal)}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleShowReceipt(r, sampahName)}
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
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  Anda belum pernah melakukan setoran sampah.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
