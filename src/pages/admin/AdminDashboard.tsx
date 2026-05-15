import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Wallet, ArrowDownToLine, Truck, TrendingUp, Tags, ArrowUpFromLine, FileText } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db as firestore, handleFirestoreError, OperationType } from '../../lib/firebase';
import { User, Setoran, Penarikan, Penjualan, HargaSampah } from '../../lib/mockDb';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalNasabah: 0,
    totalSaldo: 0,
    totalSampahMasuk: 0,
    totalPenjualan: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState<Setoran[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<Record<string, User>>({});
  const [hargaData, setHargaData] = useState<Record<string, HargaSampah>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Users
        const usersSnap = await getDocs(collection(firestore, 'users'));
        let nasabahCount = 0;
        let totalSaldoCalc = 0;
        const uData: Record<string, User> = {};
        usersSnap.forEach(doc => {
          const u = { id: doc.id, ...doc.data() } as User;
          uData[doc.id] = u;
          if (u.role === 'nasabah') {
            nasabahCount++;
            totalSaldoCalc += u.balance || 0;
          }
        });
        setUsersData(uData);

        // Fetch Harga Sampah
        const hargaSnap = await getDocs(collection(firestore, 'hargaSampah'));
        const hData: Record<string, HargaSampah> = {};
        hargaSnap.forEach(doc => {
          hData[doc.id] = doc.data() as HargaSampah;
        });
        setHargaData(hData);

        // Fetch Setoran
        const setoranSnap = await getDocs(collection(firestore, 'setoran'));
        const setData: Setoran[] = [];
        let totalSampahCalc = 0;
        setoranSnap.forEach(doc => {
          const s = { id: doc.id, ...doc.data() } as Setoran;
          setData.push(s);
          totalSampahCalc += s.weight || 0;
        });

        // Fetch Penjualan
        const penjualanSnap = await getDocs(collection(firestore, 'penjualan'));
        let totalPenjualanCalc = 0;
        penjualanSnap.forEach(doc => {
          const p = doc.data() as Penjualan;
          totalPenjualanCalc += p.total || 0;
        });

        setStats({
          totalNasabah: nasabahCount,
          totalSaldo: totalSaldoCalc,
          totalSampahMasuk: totalSampahCalc,
          totalPenjualan: totalPenjualanCalc,
        });

        // Setup Recent Transactions
        const sortedSetoran = setData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentTransactions(sortedSetoran.slice(0, 5));

        // Simple mock chart data (last 7 days setoran weight)
        const data = [];
        for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const dailySetoran = setData.filter(s => s.date.startsWith(dateStr));
          const dailyWeight = dailySetoran.reduce((sum, s) => sum + s.weight, 0);
          data.push({
            name: d.toLocaleDateString('id-ID', { weekday: 'short' }),
            berat: dailyWeight
          });
        }
        setChartData(data);

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'multiple_collections');
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const statCards = [
    { title: 'Total Nasabah', value: stats.totalNasabah, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Saldo Nasabah', value: formatCurrency(stats.totalSaldo), icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Sampah Masuk (Kg)', value: stats.totalSampahMasuk.toFixed(1), icon: ArrowDownToLine, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Penjualan Pengepul', value: formatCurrency(stats.totalPenjualan), icon: Truck, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  ];

  const menuItems = [
    { name: 'Data Nasabah', path: '/admin/nasabah', icon: Users, color: 'bg-blue-500' },
    { name: 'Harga Sampah', path: '/admin/harga', icon: Tags, color: 'bg-purple-500' },
    { name: 'Setoran', path: '/admin/setoran', icon: ArrowDownToLine, color: 'bg-emerald-500' },
    { name: 'Penarikan', path: '/admin/penarikan', icon: ArrowUpFromLine, color: 'bg-rose-500' },
    { name: 'Pengepul', path: '/admin/pengepul', icon: Truck, color: 'bg-indigo-500' },
    { name: 'Laporan', path: '/admin/laporan', icon: FileText, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Menu Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {menuItems.map((menu, idx) => {
          const Icon = menu.icon;
          return (
              <button
              key={idx}
              onClick={() => navigate(menu.path)}
              className="group flex flex-col items-center justify-center p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all active:scale-95"
            >
              <div className={`${menu.color} text-white p-4 rounded-full mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-slate-700 text-center group-hover:text-emerald-700 transition-colors">{menu.name}</span>
            </button>
          )
        })}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.title}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-2 font-mono tracking-tight">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Grafik Sampah Masuk (7 Hari Terakhir)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'monospace' }} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="berat" name="Berat (Kg)" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Setoran Terbaru</h3>
             <button onClick={() => navigate('/admin/setoran')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Lihat Semua</button>
          </div>
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map(trx => {
                const nasabah = usersData[trx.userId];
                const sampah = hargaData[trx.sampahId];
                return (
                  <div key={trx.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        {nasabah?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{nasabah?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 font-medium">{sampah?.name} • <span className="font-mono">{trx.weight} Kg</span></p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm font-mono group-hover:scale-105 transition-transform">+{formatCurrency(trx.subtotal)}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{new Date(trx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <ArrowDownToLine className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium text-sm">Belum ada transaksi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
