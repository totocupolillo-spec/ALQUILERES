import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Receipt } from '../App';

interface PaymentsHistoryProps {
  receipts: Receipt[];
}

const PaymentsHistory: React.FC<PaymentsHistoryProps> = ({ receipts }) => {

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filtered = useMemo(() => {

    return receipts.filter(r => {

      const date = new Date(r.createdDate);

      if (fromDate && date < new Date(fromDate)) return false;

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23,59,59,999);
        if (date > to) return false;
      }

      return true;

    });

  }, [receipts, fromDate, toDate]);

  const total = filtered.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

  return (
    <div className="space-y-6">

      <div className="flex gap-4">
        <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-3 py-2 rounded-lg" />
        <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-3 py-2 rounded-lg" />
      </div>

      <div className="text-sm">
        Total del período: <strong>${total.toLocaleString()}</strong>
      </div>

      <div className="bg-white rounded-xl shadow border max-h-96 overflow-y-auto">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-blue-50">
                <td className="px-6 py-4">{r.createdDate}</td>
                <td className="px-6 py-4">{r.tenant}</td>
                <td className="px-6 py-4 font-semibold text-green-600">
                  ${r.paidAmount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PaymentsHistory;