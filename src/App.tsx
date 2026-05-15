/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Admin Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import DataNasabah from './pages/admin/DataNasabah';
import HargaSampah from './pages/admin/HargaSampah';
import SetoranSampah from './pages/admin/SetoranSampah';
import PenarikanSaldo from './pages/admin/PenarikanSaldo';
import JualPengepul from './pages/admin/JualPengepul';
import Laporan from './pages/admin/Laporan';
import AdminProfil from './pages/admin/AdminProfil';

// Nasabah Pages
import NasabahLayout from './layouts/NasabahLayout';
import NasabahDashboard from './pages/nasabah/NasabahDashboard';
import RiwayatSetoran from './pages/nasabah/RiwayatSetoran';
import RequestPenarikan from './pages/nasabah/RequestPenarikan';
import Profil from './pages/nasabah/Profil';
import ListHargaSampah from './pages/nasabah/ListHargaSampah';

export default function App() {
  useEffect(() => {
    // 1. Mencegah klik kanan (Context menu)
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    // 2. Mencegah shortcut keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (e.key === 'F12') e.preventDefault();
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && e.key.toLowerCase() === 'i') e.preventDefault();
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && e.key.toLowerCase() === 'j') e.preventDefault();
      if (cmdOrCtrl && (e.key.toLowerCase() === 'u' || (isMac && e.altKey && e.key.toLowerCase() === 'u'))) e.preventDefault();
      if (cmdOrCtrl && e.key.toLowerCase() === 's') e.preventDefault();
      if (cmdOrCtrl && (e.shiftKey || (isMac && e.altKey)) && e.key.toLowerCase() === 'c') e.preventDefault();
      if (cmdOrCtrl && e.key.toLowerCase() === 'p') e.preventDefault();
    };

    const antiDebugger = setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        console.clear();
        console.log("%cSTOP!", "color: red; font-size: 40px; font-weight: bold;");
      }
    }, 1000);

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      clearInterval(antiDebugger);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="nasabah" element={<DataNasabah />} />
              <Route path="harga" element={<HargaSampah />} />
              <Route path="setoran" element={<SetoranSampah />} />
              <Route path="penarikan" element={<PenarikanSaldo />} />
              <Route path="pengepul" element={<JualPengepul />} />
              <Route path="laporan" element={<Laporan />} />
              <Route path="profil" element={<AdminProfil />} />
            </Route>
          </Route>

          {/* Nasabah Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['nasabah']} />}>
            <Route path="/nasabah" element={<NasabahLayout />}>
              <Route index element={<NasabahDashboard />} />
              <Route path="riwayat" element={<RiwayatSetoran />} />
              <Route path="tarik" element={<RequestPenarikan />} />
              <Route path="harga" element={<ListHargaSampah />} />
              <Route path="profil" element={<Profil />} />
            </Route>
          </Route>

          {/* Fallback for unauthorized access */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
