import React, { useState } from 'react';
import { Plus, Eye, Printer, BarChart3 } from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';
import MonthlySummary from './MonthlySummary';

interface ReceiptsManagerProps {
  tenants: Tenant[];
  properties: Property[];
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => void;
  updateTenantBalance: (tenantName: string, newBalance: number) => void;
  supabaseHook: any;
  user: any;
}

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({
  tenants,
  properties,
  receipts,
  setReceipts
}) => {

  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);

  const normalizeReceipt = (r: Receipt): Receipt => ({
    ...r,
    total: r.total ?? 0,
    paidAmount: r.paidAmount ?? 0,
    remainingBalance: r.remainingBalance ?? 0
  });

  const isUpdateMonth = (tenant: Tenant) => {
    if (!tenant.contractStart || !tenant.updateFrequencyMonths) return false;

    const start = new Date(tenant.contractStart);
    const now = new Date();

    const monthsDiff =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    return monthsDiff > 0 && monthsDiff % tenant.updateFrequencyMonths === 0;
  };

  const generateReceipt = () => {
    if (!selectedTenantId) return;

    const tenant = tenants.find(t => t.id === selectedTenantId);
    if (!tenant) return;

    const property = properties.find(p => p.id === tenant.propertyId);
    if (!property) return;

    if (isUpdateMonth(tenant)) {
      alert('⚠ Este mes corresponde actualización de contrato. Verificá el monto antes de continuar.');
    }

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `R-${Date.now()}`,
      tenant: tenant.name,
      property: property.name,
      building: property.building,
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
      rent: property.rent ?? 0,
      expenses: property.expenses ?? 0,
      otherCharges: [],
      previousBalance: tenant.balance ?? 0,
      total: (property.rent ?? 0) + (property.expenses ?? 0) + (tenant.balance ?? 0),
      paidAmount: 0,
      remainingBalance: (property.rent ?? 0) + (property.expenses ?? 0) + (tenant.balance ?? 0),
      currency: 'ARS',
      paymentMethod: 'efectivo',
      status: 'pendiente',
      dueDate: new Date().toISOString(),
      createdDate: new Date().toISOString()
    };

    setReceipts(prev => [newReceipt, ...prev]);

    setShowGenerateModal(false);
    setSelectedTenantId(null);
  };

  const printReceipt = (receipt: Receipt) => {
    const safe = normalizeReceipt(receipt);

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <body style="font-family: Arial; padding:40px">
          <h2>Recibo ${safe.receiptNumber}</h2>
          <p><strong>Inquilino:</strong> ${safe.tenant}</p>
          <p><strong>Propiedad:</strong> ${safe.property}</p>
          <p><strong>Total:</strong> $${safe.total.toLocaleString()}</p>
          <p><strong>Pagado:</strong> $${safe.paidAmount.toLocaleString()}</p>
          <p><strong>Saldo:</strong> $${safe.remainingBalance.toLocaleString()}</p>
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recibos</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Generar Recibo
          </button>

          <button
            onClick={() => setShowMonthlySummary(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Resumen Mensual
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Recibo</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => {
              const safe = normalizeReceipt(r);

              return (
                <tr key={safe.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">{safe.receiptNumber}</td>
                  <td>{safe.tenant}</td>
                  <td>${safe.total.toLocaleString()}</td>
                  <td>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      safe.remainingBalance > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {safe.remainingBalance > 0 ? 'Pendiente' : 'Pagado'}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedReceipt(safe)}
                      className="text-blue-600"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="font-semibold text-lg">Generar Recibo</h3>

            <select
              value={selectedTenantId ?? ''}
              onChange={e => setSelectedTenantId(Number(e.target.value))}
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccionar Inquilino</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>

              <button
                onClick={generateReceipt}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="mb-4 font-semibold">
              Recibo {selectedReceipt.receiptNumber}
            </h3>

            <div className="space-y-2">
              <p><strong>Total:</strong> ${selectedReceipt.total.toLocaleString()}</p>
              <p><strong>Pagado:</strong> ${selectedReceipt.paidAmount.toLocaleString()}</p>
              <p><strong>Saldo:</strong> ${selectedReceipt.remainingBalance.toLocaleString()}</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => printReceipt(selectedReceipt)}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                <Printer className="h-4 w-4 inline mr-1" />
                Imprimir
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showMonthlySummary && (
        <MonthlySummary
          receipts={receipts}
          tenants={tenants}
          properties={properties}
          onClose={() => setShowMonthlySummary(false)}
        />
      )}

    </div>
  );
};

export default ReceiptsManager;