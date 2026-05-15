import React, { useState, useEffect } from 'react';
import { Download, Printer } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Setoran, Penarikan, Penjualan } from '../../lib/mockDb';

export default function Laporan() {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [filteredSetoran, setFilteredSetoran] = useState<Setoran[]>([]);
  const [filteredPenarikan, setFilteredPenarikan] = useState<Penarikan[]>([]);
  const [filteredPenjualan, setFilteredPenjualan] = useState<Penjualan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const startDate = new Date(selectedYear, selectedMonth - 1, 1).toISOString();
        const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).toISOString();

        const pSetoran = getDocs(query(
          collection(firestore, 'setoran'),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        ));
        
        const pPenarikan = getDocs(query(
          collection(firestore, 'penarikan'),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        ));

        const pPenjualan = getDocs(query(
          collection(firestore, 'penjualan'),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        ));

        const [snapSetoran, snapPenarikan, snapPenjualan] = await Promise.all([pSetoran, pPenarikan, pPenjualan]);

        const setData: Setoran[] = [];
        snapSetoran.forEach(doc => setData.push({ id: doc.id, ...doc.data() } as Setoran));

        const penData: Penarikan[] = [];
        snapPenarikan.forEach(doc => penData.push({ id: doc.id, ...doc.data() } as Penarikan));

        const jualData: Penjualan[] = [];
        snapPenjualan.forEach(doc => jualData.push({ id: doc.id, ...doc.data() } as Penjualan));

        setFilteredSetoran(setData);
        setFilteredPenarikan(penData);
        setFilteredPenjualan(jualData);

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'multiple');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedYear]);

  const totalSetoran = filteredSetoran.reduce((sum, s) => sum + s.subtotal, 0);
  const totalPenarikan = filteredPenarikan.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
  const totalPenjualan = filteredPenjualan.reduce((sum, p) => sum + p.total, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 5}, (_, i) => currentYear - i);
  const months = [
    { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
    { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' }, { value: 12, label: 'Desember' }
  ];

  const handleExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    const monthName = months.find(m => m.value === selectedMonth)?.label;
    csvContent += `Laporan Bulan ${monthName} Tahun ${selectedYear}\n\n`;
    
    csvContent += "Tipe,Tanggal,Keterangan,Jumlah (Rp)\n";
    
    filteredSetoran.forEach(s => {
      csvContent += `Setoran Masuk,${new Date(s.date).toLocaleDateString('id-ID')},Nasabah ${s.userId},${s.subtotal}\n`;
    });
    
    filteredPenarikan.filter(p => p.status === 'approved').forEach(p => {
      csvContent += `Penarikan Keluar,${new Date(p.date).toLocaleDateString('id-ID')},Nasabah ${p.userId},${p.amount}\n`;
    });
    
    filteredPenjualan.forEach(p => {
      csvContent += `Penjualan,${new Date(p.date).toLocaleDateString('id-ID')},Pengepul ${p.pengepulName},${p.total}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_EcoBank_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const SummaryCard = ({ title, value, type }: { title: string, value: string, type: 'in' | 'out' | 'neutral' }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <p className={`text-2xl font-bold ${type === 'in' ? 'text-emerald-600' : type === 'out' ? 'text-red-500' : 'text-indigo-600'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm no-print">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Summary Laporan</h2>
          <p className="text-sm text-gray-500">Ringkasan transaksi bank sampah</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto items-start sm:items-center gap-3">
          <div className="flex gap-2 w-full sm:w-auto">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 flex-1 sm:flex-none disabled:opacity-50"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-emerald-500 focus:border-emerald-500 flex-1 sm:flex-none disabled:opacity-50"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={handlePrint} disabled={isLoading} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition disabled:opacity-50">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </button>
            <button onClick={handleExport} disabled={isLoading} className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-sm disabled:opacity-50">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="print-only mb-6 hidden">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Laporan Rekapitulasi EcoBank</h2>
        <p className="text-center text-gray-600">Periode: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</p>
        <hr className="my-6 border-gray-300" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard title="Total Masuk (Setoran Nasabah)" value={formatCurrency(totalSetoran)} type="in" />
        <SummaryCard title="Total Keluar (Penarikan Nasabah)" value={formatCurrency(totalPenarikan)} type="out" />
        <SummaryCard title="Total Pendapatan (Penjualan)" value={formatCurrency(totalPenjualan)} type="neutral" />
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Rekap Aktivitas Bulan {months.find(m => m.value === selectedMonth)?.label} {selectedYear}</h3>
        </div>
        <div className="p-0 overflow-x-auto">
          {isLoading ? (
             <div className="p-8 text-center text-gray-500">Memuat data...</div>
          ) : filteredSetoran.length === 0 && filteredPenarikan.filter(p => p.status === 'approved').length === 0 && filteredPenjualan.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>Tidak ada data di bulan ini.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Tipe Transaksi</th>
                  <th className="px-6 py-4 font-medium">Keterangan</th>
                  <th className="px-6 py-4 font-medium text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredSetoran.map(s => (
                   <tr key={`setoran-${s.id}`} className="hover:bg-gray-50/50">
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(s.date).toLocaleDateString('id-ID')}</td>
                     <td className="px-6 py-4 whitespace-nowrap"><span className="text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded">Setoran Masuk</span></td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-900">Nasabah ID: {s.userId}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(s.subtotal)}</td>
                   </tr>
                ))}
                {filteredPenarikan.filter(p => p.status === 'approved').map(p => (
                   <tr key={`penarikan-${p.id}`} className="hover:bg-gray-50/50">
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(p.date).toLocaleDateString('id-ID')}</td>
                     <td className="px-6 py-4 whitespace-nowrap"><span className="text-red-500 font-medium bg-red-50 px-2 py-1 rounded">Penarikan Saldo</span></td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-900">Nasabah ID: {p.userId}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                   </tr>
                ))}
                {filteredPenjualan.map(p => (
                   <tr key={`penjualan-${p.id}`} className="hover:bg-gray-50/50">
                     <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(p.date).toLocaleDateString('id-ID')}</td>
                     <td className="px-6 py-4 whitespace-nowrap"><span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-1 rounded">Penjualan</span></td>
                     <td className="px-6 py-4 whitespace-nowrap text-gray-900">Pengepul: {p.pengepulName}</td>
                     <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">{formatCurrency(p.total)}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
