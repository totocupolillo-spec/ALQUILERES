import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';

interface ReceiptsManagerProps {
  tenants: Tenant[];
  properties: Property[];
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => void;
  updateTenantBalance: (tenantName: string, newBalance: number) => void;
}

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({
  tenants,
  properties,
  receipts,
  setReceipts,
  addCashMovement,
  updateTenantBalance
}) => {

  const [showModal, setShowModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('');
  const [paidAmount, setPaidAmount] = useState(0);

  const generateReceipt = () => {

    const tenant = tenants.find(t => t.name === selectedTenant);
    if (!tenant) return;

    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property) return;

    const month = new Date().toLocaleString('es-AR', { month: 'long' });
    const year = new Date().getFullYear();

    const total = Number(property.rent || 0);
    const remainingBalance = Math.max(total - paidAmount, 0);

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `R-${Date.now()}`,
      tenant: tenant.name,
      property: property.name,
      building: property.building,
      month: month.charAt(0).toUpperCase() + month.slice(1),
      year,
      rent: property.rent,
      expenses: property.expenses,
      otherCharges: [],
      previousBalance: 0,
      total,
      paidAmount,
      remainingBalance,
      currency: 'ARS',
      paymentMethod: 'efectivo',
      status: remainingBalance === 0 ? 'pagado' : 'pendiente',
      dueDate: new Date().toISOString(),
      createdDate: new Date().toISOString()
    };

    setReceipts(prev => [newReceipt, ...prev]);

    if (paidAmount > 0) {
      addCashMovement({
        type: 'income',
        description: `Pago alquiler ${tenant.name}`,
        amount: paidAmount,
        currency: 'ARS',
        date: new Date().toISOString(),
        tenant: tenant.name,
        property: property.name
      });
    }

    updateTenantBalance(tenant.name, remainingBalance);

    setShowModal(false);
    setSelectedTenant('');
    setPaidAmount(0);
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Generar Recibo</span>
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">

            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuevo Recibo</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">

              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="w-full border px-3 py-2 rounded-lg"
              >
                <option value="">Seleccionar Inquilino</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>

              <input
                type="number"
                placeholder="Monto pagado"
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full border px-3 py-2 rounded-lg"
              />

              <button
                onClick={generateReceipt}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirmar
              </button>

            </div>

          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium">Recibo</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id}>
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td className="px-6 py-4">{r.tenant}</td>
                <td className="px-6 py-4">${r.total.toLocaleString()}</td>
                <td className="px-6 py-4">
                  {r.status === 'pagado'
                    ? <span className="text-green-600 font-semibold">Pagado</span>
                    : <span className="text-red-600 font-semibold">Pendiente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default ReceiptsManager;