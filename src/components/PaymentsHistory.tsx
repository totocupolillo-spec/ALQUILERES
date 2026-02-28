import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Receipt } from '../App';

interface PaymentsHistoryProps {
  receipts: Receipt[];
}

const safeNumber = (v: any) => Number(v ?? 0);

const PaymentsHistory: React.FC<PaymentsHistoryProps> = ({ receipts }) => {

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const normalizedPayments = useMemo(() => {
    return receipts.map(r => ({
      id: r.id,
      date: new Date(r.createdDate),
      tenant: r.tenant,
      property: r.property,
      amount: safeNumber(r.paidAmount)
    }));
  }, [receipts]);

  const filteredPayments = useMemo(() => {

    return normalizedPayments.filter(p => {

      if (fromDate) {
        const from = new Date(fromDate);
        if (p.date < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23,59,59,999);
        if (p.date > to) return false;
      }

      return true;
    });

  }, [normalizedPayments, fromDate, toDate]);

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const exportToCSV = () => {

    const headers = ['Fecha','Inquilino','Propiedad','Monto'];

    const rows = filteredPayments.map(p => [
      p.date.toLocaleDateString(),
      p.tenant,
      p.property,
      p.amount
    ]);

    const csvContent = [headers, ...rows]
      .map(r => r.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_filtrado.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Historial de Pagos</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />
        <div className="flex items-center font-semibold text-blue-800">
          Total: ${totalAmount.toLocaleString()}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Inquilino</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Propiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{p.date.toLocaleDateString()}</td>
                  <td className="px-6 py-4">{p.tenant}</td>
                  <td className="px-6 py-4">{p.property}</td>
                  <td className="px-6 py-4 font-semibold text-blue-700">
                    ${p.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No hay pagos en el rango seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default PaymentsHistory;