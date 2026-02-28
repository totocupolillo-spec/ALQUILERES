import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Receipt, Tenant, Property } from '../App';

interface MonthlySummaryProps {
  receipts: Receipt[];
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  receipts,
  tenants,
  properties,
  onClose
}) => {

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showCollected, setShowCollected] = useState(false);
  const [showDebt, setShowDebt] = useState(false);

  const summaryData = useMemo(() => {

    const monthReceipts = receipts.filter(r =>
      r.month === selectedMonth &&
      r.year === selectedYear
    );

    const grouped: Record<string, {
      tenant: string;
      paid: number;
      debt: number;
    }> = {};

    monthReceipts.forEach(r => {
      if (!grouped[r.tenant]) {
        grouped[r.tenant] = {
          tenant: r.tenant,
          paid: 0,
          debt: 0
        };
      }
      grouped[r.tenant].paid += r.paidAmount || 0;
      grouped[r.tenant].debt += r.remainingBalance || 0;
    });

    return Object.values(grouped);

  }, [receipts, selectedMonth, selectedYear]);

  const totalCollected = summaryData.reduce((sum, r) => sum + r.paid, 0);
  const totalDebt = summaryData.reduce((sum, r) => sum + r.debt, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl p-6 w-full max-w-4xl space-y-6">

        <div className="flex justify-between">
          <h3 className="text-lg font-semibold">Resumen Mensual</h3>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-4">
          <input
            placeholder="Mes"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          />
          <input
            type="number"
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border px-3 py-2 rounded-lg"
          />
        </div>

        {/* Totales */}
        <div className="grid grid-cols-2 gap-6">

          <div
            onClick={() => setShowCollected(true)}
            className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition"
          >
            <p className="text-sm">Total Cobranzas</p>
            <p className="text-2xl font-bold text-green-700">
              ${totalCollected.toLocaleString()}
            </p>
          </div>

          <div
            onClick={() => setShowDebt(true)}
            className="bg-red-50 p-4 rounded-lg cursor-pointer hover:bg-red-100 transition"
          >
            <p className="text-sm">Total Adeudado</p>
            <p className="text-2xl font-bold text-red-700">
              ${totalDebt.toLocaleString()}
            </p>
          </div>

        </div>

        {/* Tabla */}
        <div className="max-h-72 overflow-y-auto border rounded-lg">
          <table className="min-w-full">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs">Inquilino</th>
                <th className="px-4 py-2 text-left text-xs">Pagado</th>
                <th className="px-4 py-2 text-left text-xs">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map(r => (
                <tr key={r.tenant} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{r.tenant}</td>
                  <td className="px-4 py-2 text-green-600">${r.paid.toLocaleString()}</td>
                  <td className="px-4 py-2 text-red-600">${r.debt.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Cobranzas */}
      {showCollected && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h4 className="font-semibold mb-4">Detalle Cobranzas</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {summaryData.map(r => (
                <div key={r.tenant} className="flex justify-between">
                  <span>{r.tenant}</span>
                  <span className="text-green-600">${r.paid.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowCollected(false)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal Adeudado */}
      {showDebt && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h4 className="font-semibold mb-4">Detalle Adeudado</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {summaryData.map(r => (
                <div key={r.tenant} className="flex justify-between">
                  <span>{r.tenant}</span>
                  <span className="text-red-600">${r.debt.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowDebt(false)} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MonthlySummary;