import React, { useState, useMemo } from 'react';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  Calendar
} from 'lucide-react';
import { CashMovement } from '../App';

interface CashRegisterProps {
  cashMovements: CashMovement[];
  setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
}

const CashRegister: React.FC<CashRegisterProps> = ({
  cashMovements,
  setCashMovements
}) => {

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* =========================
     FILTRO POR RANGO
     ========================= */

  const filteredMovements = useMemo(() => {
    return cashMovements.filter(m => {

      const movementDate = new Date(m.date);

      if (fromDate) {
        const from = new Date(fromDate);
        if (movementDate < from) return false;
      }

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23,59,59,999);
        if (movementDate > to) return false;
      }

      return true;
    });
  }, [cashMovements, fromDate, toDate]);

  /* =========================
     TOTALES DEL PERÍODO
     ========================= */

  const totals = useMemo(() => {

    const incomeARS = filteredMovements
      .filter(m => m.type === 'income' && m.currency === 'ARS')
      .reduce((sum, m) => sum + m.amount, 0);

    const deliveryARS = filteredMovements
      .filter(m => m.type === 'delivery' && m.currency === 'ARS')
      .reduce((sum, m) => sum + m.amount, 0);

    const incomeUSD = filteredMovements
      .filter(m => m.type === 'income' && m.currency === 'USD')
      .reduce((sum, m) => sum + m.amount, 0);

    const deliveryUSD = filteredMovements
      .filter(m => m.type === 'delivery' && m.currency === 'USD')
      .reduce((sum, m) => sum + m.amount, 0);

    return {
      incomeARS,
      deliveryARS,
      balanceARS: incomeARS - deliveryARS,
      incomeUSD,
      deliveryUSD,
      balanceUSD: incomeUSD - deliveryUSD
    };

  }, [filteredMovements]);

  /* =========================
     EXPORTACIÓN FILTRADA
     ========================= */

  const exportMovements = () => {

    const headers = [
      'Fecha',
      'Tipo',
      'Descripción',
      'Monto',
      'Moneda',
      'Inquilino',
      'Propiedad'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredMovements.map(m => [
        m.date,
        m.type === 'income' ? 'Ingreso' : 'Entrega',
        m.description,
        m.amount,
        m.currency,
        m.tenant || '',
        m.property || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arqueo_filtrado.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Arqueo de Caja</h2>
        <button
          onClick={exportMovements}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Exportar Filtrado
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
          Movimientos: {filteredMovements.length}
        </div>
      </div>

      {/* Resumen del período */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600">Balance ARS (período)</p>
          <p className="text-2xl font-bold text-blue-900">
            ${totals.balanceARS.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            Ingresos: ${totals.incomeARS.toLocaleString()} | Entregas: ${totals.deliveryARS.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600">Balance USD (período)</p>
          <p className="text-2xl font-bold text-blue-900">
            ${totals.balanceUSD.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            Ingresos: ${totals.incomeUSD.toLocaleString()} | Entregas: ${totals.deliveryUSD.toLocaleString()}
          </p>
        </div>

      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Monto</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{m.date}</td>
                  <td className={`px-6 py-4 font-semibold ${m.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'income' ? 'Ingreso' : 'Entrega'}
                  </td>
                  <td className="px-6 py-4">{m.description}</td>
                  <td className={`px-6 py-4 font-semibold ${m.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'income' ? '+' : '-'}{m.currency} ${m.amount.toLocaleString()}
                  </td>
                </tr>
              ))}

              {filteredMovements.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">
                    No hay movimientos en el rango seleccionado.
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

export default CashRegister;