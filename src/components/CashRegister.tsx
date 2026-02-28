import React, { useMemo, useState } from 'react';
import { CashMovement } from '../App';

interface CashRegisterProps {
  cashMovements: CashMovement[];
  setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
  supabaseHook: any;
  user: any;
}

const CashRegister: React.FC<CashRegisterProps> = ({
  cashMovements
}) => {

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const filteredMovements = useMemo(() => {
    return cashMovements.filter(m => {
      if (!m.date) return false;

      if (fromDate && m.date < fromDate) return false;
      if (toDate && m.date > toDate) return false;

      return true;
    });
  }, [cashMovements, fromDate, toDate]);

  const totalIncome = filteredMovements
    .filter(m => m.type === 'income')
    .reduce((sum, m) => sum + m.amount, 0);

  const totalDelivery = filteredMovements
    .filter(m => m.type === 'delivery')
    .reduce((sum, m) => sum + m.amount, 0);

  const balance = totalIncome - totalDelivery;

  const exportCSV = () => {
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Moneda'];
    const rows = filteredMovements.map(m => [
      m.date,
      m.type,
      m.description,
      m.amount,
      m.currency
    ]);

    const csvContent =
      [headers, ...rows].map(e => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arqueo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Arqueo de Caja</h2>

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

      <div className="grid grid-cols-3 gap-6">

        <div className="bg-green-50 p-4 rounded-xl shadow">
          <p className="text-sm">Ingresos</p>
          <p className="text-xl font-bold text-green-700">
            ${totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-red-50 p-4 rounded-xl shadow">
          <p className="text-sm">Egresos</p>
          <p className="text-xl font-bold text-red-700">
            ${totalDelivery.toLocaleString()}
          </p>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl shadow">
          <p className="text-sm">Balance</p>
          <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            ${balance.toLocaleString()}
          </p>
        </div>

      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left">Fecha</th>
              <th className="px-6 py-3 text-left">Tipo</th>
              <th className="px-6 py-3 text-left">Descripción</th>
              <th className="px-6 py-3 text-left">Monto</th>
            </tr>
          </thead>
          <tbody>
            {filteredMovements.map(m => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{m.date}</td>
                <td className={m.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {m.type}
                </td>
                <td>{m.description}</td>
                <td>
                  {m.type === 'income' ? '+' : '-'}
                  ${m.amount.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default CashRegister;