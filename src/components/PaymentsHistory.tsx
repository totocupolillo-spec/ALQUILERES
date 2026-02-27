import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Receipt } from '../App';

interface PaymentsHistoryProps {
  receipts: Receipt[];
}

const safeNumber = (value: any) => {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
};

const safeString = (value: any) => value ?? '';

const PaymentsHistory: React.FC<PaymentsHistoryProps> = ({ receipts }) => {

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // 🔒 Normalizamos datos por si Firebase trae campos faltantes
  const payments = useMemo(() => {
    return (receipts || []).map((receipt, index) => ({
      id: receipt?.id ?? `temp-${index}`,
      createdDate: safeString(receipt?.createdDate),
      receiptNumber: safeString(receipt?.receiptNumber),
      tenant: safeString(receipt?.tenant),
      property: safeString(receipt?.property),
      year: receipt?.year ?? currentYear,
      amount: safeNumber(receipt?.paidAmount),
      total: safeNumber(receipt?.total),
      remaining: safeNumber(receipt?.remainingBalance)
    }));
  }, [receipts]);

  const filteredPayments = payments.filter(p => p.year === selectedYear);

  const totalAmount = filteredPayments.reduce(
    (sum, payment) => sum + safeNumber(payment.amount),
    0
  );

  const exportToCSV = () => {
    const headers = ['Fecha', 'Recibo', 'Inquilino', 'Propiedad', 'Monto'];

    const rows = filteredPayments.map(p => [
      safeString(p.createdDate),
      safeString(p.receiptNumber),
      safeString(p.tenant),
      safeString(p.property),
      safeNumber(p.amount)
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Historial de Pagos</h2>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Total del año {selectedYear}:{' '}
        <strong>${safeNumber(totalAmount).toLocaleString()}</strong>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredPayments.map(payment => (
              <tr key={payment.id}>
                <td className="px-6 py-4 text-sm">
                  {payment.createdDate || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {payment.receiptNumber || '-'}
                </td>
                <td className="px-6 py-4 text-sm">
                  {payment.tenant || '-'}
                </td>
                <td className="px-6 py-4 text-sm font-semibold">
                  ${safeNumber(payment.amount).toLocaleString()}
                </td>
              </tr>
            ))}

            {filteredPayments.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                  No hay pagos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default PaymentsHistory;