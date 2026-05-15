import { useState, useEffect } from 'react';
import { Tags, Search } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { HargaSampah } from '../../lib/mockDb';

export default function ListHargaSampah() {
  const [harga, setHarga] = useState<HargaSampah[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = query(collection(firestore, 'hargaSampah'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: HargaSampah[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as HargaSampah);
      });
      // Sort alphabetically
      setHarga(data.sort((a,b) => a.name.localeCompare(b.name)));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'hargaSampah');
    });

    return () => unsubscribe();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const filteredData = harga.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg mr-4">
            <Tags className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Daftar Harga Sampah</h2>
            <p className="text-sm text-gray-500">Harga dapat berubah sewaktu-waktu sesuai harga pasar</p>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            placeholder="Cari sampah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length > 0 ? (
            filteredData.map(h => (
              <div key={h.id} className="border border-gray-200 rounded-xl p-4 hover:border-emerald-400 transition-colors bg-white">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {h.category}
                  </span>
                  <span className="text-xs text-gray-400">Kode: {h.code}</span>
                </div>
                <h3 className="font-bold text-gray-900 mt-2 mb-1">{h.name}</h3>
                <div className="flex items-end mt-4">
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(h.pricePerKg)}</span>
                  <span className="text-gray-500 text-sm ml-1 mb-1">/ Kg</span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
                  Update terakhir: {new Date(h.lastUpdate).toLocaleDateString('id-ID')}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500">
              Tidak ada data harga sampah ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
