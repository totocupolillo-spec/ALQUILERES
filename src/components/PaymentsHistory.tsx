import React, { useMemo, useState } from 'react';
import { Receipt } from '../App';

interface PaymentsHistoryProps {
  receipts: Receipt[];
}

const PaymentsHistory: React.FC<PaymentsHistoryProps> = ({ receipts }) => {

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredReceipts = useMemo(() => {
    return receipts.filter(r => {
      if (!r.createdDate) return false;

      if (fromDate && r.createdDate < fromDate) return false;
      if (toDate && r.createdDate > toDate) return false;

      return true;
    });
  }, [receipts, fromDate, toDate]);

  const totalFiltered = filteredReceipts.reduce(
    (sum, r) => sum + r.paidAmount,
    0
  );

  const exportCSV = () => {
    const headers = ['Recibo', 'Inquilino', 'Fecha', 'Total', 'Pagado', 'Saldo'];
    const rows = filteredReceipts.map(r => [
      r.receiptNumber,
      r.tenant,
      r.createdDate,
      r.total,
      r.paidAmount,
      r.remainingBalance
    ]);

    const csvContent =
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Historial de Pagos</h2>

      <div className="bg-white p-4 rounded-xl shadow border flex gap-4 items-end">
        <div>
          <label className="text-sm">Desde</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border p-2 rounded-lg"
          />
        </div>

        <div>
          <label className="text-sm">Hasta</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border p-2 rounded-lg"
          />
        </div>

        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Exportar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left">Recibo</th>
              <th className="px-6 py-3 text-left">Inquilino</th>
              <th className="px-6 py-3 text-left">Fecha</th>
              <th className="px-6 py-3 text-left">Total</th>
              <th className="px-6 py-3 text-left">Pagado</th>
              <th className="px-6 py-3 text-left">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {filteredReceipts.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td>{r.tenant}</td>
                <td>{r.createdDate}</td>
                <td>${r.total.toLocaleString()}</td>
                <td className="text-green-600">
                  ${r.paidAmount.toLocaleString()}
                </td>
                <td className={r.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                  ${r.remainingBalance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="font-semibold">
          Total Cobrado en el período: ${totalFiltered.toLocaleString()}
        </p>
      </div>

    </div>
  );
};

export default PaymentsHistory;