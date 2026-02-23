import React, { useState } from 'react';
import { Wallet, DollarSign, TrendingUp, ArrowUpRight, ArrowDownLeft, Download, Calendar } from 'lucide-react';
import { CashMovement } from '../App';

interface CashRegisterProps {
  cashMovements: CashMovement[];
  setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
}

const CashRegister: React.FC<CashRegisterProps> = ({ cashMovements, setCashMovements }) => {
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryAmount, setDeliveryAmount] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'ARS' | 'USD'>('ARS');
  const [deliveryCategory, setDeliveryCategory] = useState<'owner' | 'maintenance' | 'commission' | 'other'>('owner');
  const [deliveryComment, setDeliveryComment] = useState('');

  // Calculate current balances
  const balanceARS = cashMovements.reduce((sum, movement) => {
    if (movement.currency === 'ARS') {
      return movement.type === 'income' ? sum + movement.amount : sum - movement.amount;
    }
    return sum;
  }, 0);

  const balanceUSD = cashMovements.reduce((sum, movement) => {
    if (movement.currency === 'USD') {
      return movement.type === 'income' ? sum + movement.amount : sum - movement.amount;
    }
    return sum;
  }, 0);

  const handleDelivery = () => {
    const amount = parseFloat(deliveryAmount);
    if (!amount || amount <= 0) return;

    const currentBalance = selectedCurrency === 'ARS' ? balanceARS : balanceUSD;
    if (amount > currentBalance) {
      alert('No hay suficiente dinero en caja para esta entrega');
      return;
    }

    const getCategoryDescription = (category: string) => {
      const descriptions = {
        owner: 'Entrega al propietario',
        maintenance: 'Gastos de mantenimiento',
        commission: 'Comisiones',
        other: 'Otros gastos'
      };
      return descriptions[category as keyof typeof descriptions];
    };

    const newMovement: CashMovement = {
      id: Date.now(),
      type: 'delivery',
      description: getCategoryDescription(deliveryCategory),
      category: deliveryCategory,
      amount,
      currency: selectedCurrency,
      date: new Date().toISOString().split('T')[0],
      comment: deliveryComment
    };

    setCashMovements([newMovement, ...cashMovements]);
    setDeliveryAmount('');
    setDeliveryCategory('owner');
    setDeliveryComment('');
    setShowDeliveryModal(false);
  };

  const resetCash = (currency: 'ARS' | 'USD') => {
    const currentBalance = currency === 'ARS' ? balanceARS : balanceUSD;
    if (currentBalance <= 0) return;

    if (confirm(`¿Está seguro de entregar todo el dinero en ${currency}? (${currency} $${currentBalance.toLocaleString()})`)) {
      const newMovement: CashMovement = {
        id: Date.now(),
        type: 'delivery',
        description: `Entrega total al propietario - ${currency}`,
        category: 'owner',
        amount: currentBalance,
        currency,
        date: new Date().toISOString().split('T')[0]
      };

      setCashMovements([newMovement, ...cashMovements]);
    }
  };

  const exportMovements = () => {
    const headers = ['Fecha', 'Tipo', 'Descripción', 'Monto', 'Moneda', 'Inquilino', 'Propiedad'];
    const csvContent = [
      headers.join(','),
      ...cashMovements.map(movement => [
        movement.date,
        movement.type === 'income' ? 'Ingreso' : 'Entrega',
        movement.description,
        movement.amount,
        movement.currency,
        movement.tenant || '',
        movement.property || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arqueo_caja_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const todayMovements = cashMovements.filter(m => m.date === new Date().toISOString().split('T')[0]);
  const todayIncomeARS = todayMovements
    .filter(m => m.type === 'income' && m.currency === 'ARS')
    .reduce((sum, m) => sum + m.amount, 0);
  const todayIncomeUSD = todayMovements
    .filter(m => m.type === 'income' && m.currency === 'USD')
    .reduce((sum, m) => sum + m.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arqueo de Caja</h2>
          <p className="text-gray-600">Control de ingresos y entregas de dinero</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportMovements}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            <span>Exportar</span>
          </button>
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowUpRight className="h-5 w-5" />
            <span>Entregar Dinero</span>
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Caja Pesos</p>
              <p className="text-3xl font-bold text-gray-900">ARS ${balanceARS.toLocaleString()}</p>
              <button
                onClick={() => resetCash('ARS')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                disabled={balanceARS <= 0}
              >
                Entregar todo
              </button>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Caja Dólares</p>
              <p className="text-3xl font-bold text-gray-900">USD ${balanceUSD.toLocaleString()}</p>
              <button
                onClick={() => resetCash('USD')}
                className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                disabled={balanceUSD <= 0}
              >
                Entregar todo
              </button>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Hoy (ARS)</p>
              <p className="text-3xl font-bold text-green-600">${todayIncomeARS.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Cobros del día</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos Hoy (USD)</p>
              <p className="text-3xl font-bold text-green-600">${todayIncomeUSD.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Cobros del día</p>
            </div>
            <div className="bg-emerald-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Movimientos de Caja</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalles
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cashMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{movement.date}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {movement.type === 'income' ? (
                        <ArrowDownLeft className="h-4 w-4 text-green-500 mr-2" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4 text-red-500 mr-2" />
                      )}
                      <span className={`text-sm font-medium ${
                        movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {movement.type === 'income' ? 'Ingreso' : 'Entrega'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{movement.description}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {movement.tenant ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{movement.tenant}</div>
                        <div className="text-sm text-gray-500">{movement.property}</div>
                      </div>
                    ) : movement.comment ? (
                      <div className="text-sm text-gray-600">{movement.comment}</div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-semibold ${
                      movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'income' ? '+' : '-'}{movement.currency} ${movement.amount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entregar Dinero al Propietario</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de entrega</label>
                <select
                  value={deliveryCategory}
                  onChange={(e) => setDeliveryCategory(e.target.value as 'owner' | 'maintenance' | 'commission' | 'other')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="owner">Entrega al propietario</option>
                  <option value="maintenance">Gastos de mantenimiento</option>
                  <option value="commission">Comisiones</option>
                  <option value="other">Otros gastos</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => {
                    setSelectedCurrency(e.target.value as 'ARS' | 'USD');
                    const maxAmount = e.target.value === 'ARS' ? balanceARS : balanceUSD;
                    setDeliveryAmount(maxAmount.toString());
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ARS">Pesos Argentinos</option>
                  <option value="USD">Dólares</option>
                </select>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Disponible en caja:</p>
                <p className="text-xl font-bold text-gray-900">
                  {selectedCurrency} ${(selectedCurrency === 'ARS' ? balanceARS : balanceUSD).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto a entregar</label>
                <input
                  type="number"
                  value={deliveryAmount}
                  onChange={(e) => setDeliveryAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  max={selectedCurrency === 'ARS' ? balanceARS : balanceUSD}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                <textarea
                  value={deliveryComment}
                  onChange={(e) => setDeliveryComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Agregar detalles sobre esta entrega..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowDeliveryModal(false);
                  setDeliveryAmount('');
                  setDeliveryCategory('owner');
                  setDeliveryComment('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelivery}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!deliveryAmount || parseFloat(deliveryAmount) <= 0}
              >
                Confirmar Entrega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashRegister;