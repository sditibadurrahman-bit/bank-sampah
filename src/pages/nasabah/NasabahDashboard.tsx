import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, History, ArrowDownToLine, Tags, UserCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Setoran, Penarikan, HargaSampah } from '../../lib/mockDb';

export default function NasabahDashboard() {
  const { appUser } = useAuth();
  const currentUser = appUser;
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSetoran: 0,
    totalPenarikan: 0,
  });
  const [recentTrx, setRecentTrx] = useState<Setoran[]>([]);
  const [hargaData, setHargaData] = useState<Record<string, HargaSampah>>({});
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch Harga Sampah
        const hargaSnap = await getDocs(collection(db, 'hargaSampah'));
        const hargaMap: Record<string, HargaSampah> = {};
        hargaSnap.forEach(h => {
          hargaMap[h.id] = { id: h.id, ...h.data() } as HargaSampah;
        });
        setHargaData(hargaMap);

        // Fetch My Setoran
        const setoranQ = query(collection(db, 'setoran'), where('userId', '==', currentUser.id));
        const setoranSnap = await getDocs(setoranQ);
        const mySetoran: Setoran[] = [];
        setoranSnap.forEach(doc => mySetoran.push({ id: doc.id, ...doc.data() } as Setoran));
        
        // Fetch My Penarikan
        const penarikanQ = query(collection(db, 'penarikan'), where('userId', '==', currentUser.id), where('status', '==', 'approved'));
        const penarikanSnap = await getDocs(penarikanQ);
        const myPenarikan: Penarikan[] = [];
        penarikanSnap.forEach(doc => myPenarikan.push({ id: doc.id, ...doc.data() } as Penarikan));

        const totalSetoran = mySetoran.reduce((sum, s) => sum + s.subtotal, 0);
        const totalPenarikan = myPenarikan.reduce((sum, p) => sum + p.amount, 0);

        setStats({ totalSetoran, totalPenarikan });
        setRecentTrx(mySetoran.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));

        // Chart mock data logic based on setoran
        const data = [];
        for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const daily = mySetoran.filter(s => s.date.startsWith(dateStr));
          const dailySubtotal = daily.reduce((sum, s) => sum + s.subtotal, 0);
          data.push({
            name: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            Nominal: dailySubtotal
          });
        }
        setChartData(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'multiple_collections');
      }
    };
    
    fetchData();
  }, [currentUser?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (!currentUser) return null;

  const menuItems = [
    { name: 'Riwayat Setoran', path: '/nasabah/riwayat', icon: History, color: 'bg-emerald-500' },
    { name: 'Tarik Saldo', path: '/nasabah/tarik', icon: Wallet, color: 'bg-blue-500' },
    { name: 'Harga Sampah', path: '/nasabah/harga', icon: Tags, color: 'bg-purple-500' },
    { name: 'Profil', path: '/nasabah/profil', icon: UserCircle, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg overflow-hidden relative">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">Halo, {currentUser.name}! 👋</h1>
          <p className="text-emerald-50 mb-8">Terima kasih telah berkontribusi untuk lingkungan yang lebih baik.</p>
          
          <div className="bg-white/20 backdrop-blur-md rounded-xl p-6 inline-block min-w-[280px]">
            <p className="text-emerald-50 text-sm font-medium mb-1">Saldo Anda Saat Ini</p>
            <h2 className="text-4xl font-bold">{formatCurrency(currentUser.balance)}</h2>
          </div>
        </div>
        {/* Decor */}
        <div className="absolute right-0 top-0 w-64 h-full opacity-10 pointer-events-none">
          <Wallet className="w-full h-full text-white transform translate-x-1/4 -translate-y-1/4" />
        </div>
      </div>

      {/* Menu Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {menuItems.map((menu, idx) => {
          const Icon = menu.icon;
          return (
            <button
              key={idx}
              onClick={() => navigate(menu.path)}
              className="group flex flex-col items-center justify-start p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all active:scale-95"
            >
              <div className={`${menu.color} text-white p-3 rounded-xl mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-slate-700 text-center leading-tight group-hover:text-emerald-700 transition-colors">{menu.name}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mr-5 group">
            <ArrowDownToLine className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Setoran</p>
            <p className="text-2xl font-bold text-slate-800 font-mono tracking-tight mt-1">{formatCurrency(stats.totalSetoran)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center hover:shadow-md transition-shadow">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl mr-5">
            <History className="w-8 h-8" />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Penarikan</p>
            <p className="text-2xl font-bold text-slate-800 font-mono tracking-tight mt-1">{formatCurrency(stats.totalPenarikan)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Grafik Pemasukan (7 Hari Terakhir)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'monospace' }} tickFormatter={(val) => `Rp${val/1000}k`} />
                <Tooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="Nominal" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorNominal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-slate-800">Setoran Terakhir</h3>
             <button onClick={() => navigate('/nasabah/riwayat')} className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Semua</button>
          </div>
          <div className="space-y-3">
            {recentTrx.length > 0 ? (
              recentTrx.map(trx => {
                const sampah = hargaData[trx.sampahId];
                return (
                  <div key={trx.id} className="flex justify-between items-center p-4 bg-slate-50 hover:bg-emerald-50 rounded-xl transition-colors border border-transparent hover:border-emerald-100 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                        {sampah?.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{sampah?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium">{new Date(trx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 text-sm font-mono group-hover:scale-105 transition-transform">+{formatCurrency(trx.subtotal)}</p>
                      <p className="text-[10px] text-slate-500 font-medium"><span className="font-mono">{trx.weight}</span> Kg</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <History className="w-8 h-8 text-slate-300" />
                 </div>
                 <p className="text-slate-500 font-medium text-sm">Belum ada riwayat setoran.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
