import React from 'react';
import { CheckCircle2, Leaf } from 'lucide-react';

export interface ReceiptItem {
  label: string;
  value: string | number;
}

interface ReceiptProps {
  type: 'Setoran Sampah' | 'Penarikan Saldo' | 'Jual Pengepul';
  transactionId: string;
  date: string;
  entityName: string; // Nasabah or Pengepul name
  entityId?: string;
  items: ReceiptItem[];
  total: number;
  onClose: () => void;
  status?: string;
}

export default function Receipt({
  type,
  transactionId,
  date,
  entityName,
  entityId,
  items,
  total,
  onClose,
  status = 'Berhasil'
}: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 no-print animate-in fade-in zoom-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative">
        {/* Receipt Header */}
        <div className="bg-emerald-500 p-6 text-white text-center pb-8 border-b-8 border-emerald-600 border-dashed">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">{status}</h2>
          <p className="text-emerald-50 font-medium">Transaksi {type}</p>
        </div>

        {/* Receipt Body */}
        <div className="p-6 bg-white shrink-0" id="receipt-content">
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-2 mb-2">
               <Leaf className="text-emerald-500 w-5 h-5" />
               <span className="font-bold text-slate-800 text-lg">Bank Sampah</span>
            </div>
            <p className="text-xs text-slate-500 font-number">{new Date(date).toLocaleString('id-ID')}</p>
            <p className="text-xs text-slate-500 font-number mt-1">ID: {transactionId}</p>
          </div>

          <div className="border-t border-b border-slate-100 py-4 mb-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-semibold text-slate-800">{entityName}</span>
            </div>
            {entityId && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">ID Pelanggan</span>
                <span className="font-medium text-slate-700 font-number">{entityId}</span>
              </div>
            )}
            
            <div className="pt-2 mt-2 border-t border-dashed border-slate-200 space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">{item.label}</span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mb-6 bg-slate-50 p-4 rounded-xl">
            <span className="font-bold text-slate-700">Total</span>
            <span className="font-bold text-xl text-emerald-600 font-number">{formatCurrency(total)}</span>
          </div>

          <p className="text-center text-xs text-slate-400 italic">
            Simpan struk ini sebagai bukti transaksi yang sah.
          </p>
        </div>

        {/* Actions - No Print */}
        <div className="p-4 bg-slate-50 flex gap-3 no-print">
          <button
            onClick={onClose}
            className="flex-1 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
          >
            Cetak Struk
          </button>
        </div>
      </div>

      {/* Global CSS for printing this specific receipt */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
}
