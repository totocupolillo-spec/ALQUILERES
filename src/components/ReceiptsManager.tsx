import React, { useState, useMemo } from 'react';
import { Plus, Eye, Printer, BarChart3, X } from 'lucide-react';
import { Tenant, Receipt, Property } from '../App';
import MonthlySummary from './MonthlySummary';

interface ReceiptsManagerProps {
  tenants: Tenant[];
  properties: Property[];
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
}

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({
  tenants,
  properties,
  receipts,
  setReceipts
}) => {

  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const [form, setForm] = useState<any>({
    tenantId: '',
    month: '',
    year: new Date().getFullYear(),
    rent: 0,
    expenses: 0,
    previousBalance: 0,
    otherCharges: [],
    currency: 'ARS',
    paymentMethod: 'efectivo',
    dueDate: ''
  });

  const selectedTenant = tenants.find(t => t.id === Number(form.tenantId));
  const selectedProperty = properties.find(p => p.id === selectedTenant?.propertyId);

  const isUpdateMonth = () => {
    if (!selectedTenant || !selectedTenant.contractStart) return false;

    const start = new Date(selectedTenant.contractStart);
    const now = new Date(form.year, new Date().getMonth());

    const monthsDiff =
      (now.getFullYear() - start.getFullYear()) * 12 +
      (now.getMonth() - start.getMonth());

    return monthsDiff > 0 && monthsDiff % selectedTenant.updateFrequencyMonths === 0;
  };

  const suggestedRent = useMemo(() => {
    if (!selectedProperty) return 0;
    return selectedProperty.rent ?? 0;
  }, [selectedProperty]);

  const total = useMemo(() => {
    const other = form.otherCharges.reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
    return Number(form.rent || 0) +
           Number(form.expenses || 0) +
           Number(form.previousBalance || 0) +
           other;
  }, [form]);

  const handleGenerate = () => {
    if (!selectedTenant || !selectedProperty) return;

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `R-${Date.now()}`,
      tenant: selectedTenant.name,
      property: selectedProperty.name,
      building: selectedProperty.building,
      month: form.month,
      year: form.year,
      rent: Number(form.rent),
      expenses: Number(form.expenses),
      otherCharges: form.otherCharges,
      previousBalance: Number(form.previousBalance),
      total,
      paidAmount: 0,
      remainingBalance: total,
      currency: form.currency,
      paymentMethod: form.paymentMethod,
      status: total > 0 ? 'pendiente' : 'pagado',
      dueDate: form.dueDate,
      createdDate: new Date().toISOString()
    };

    setReceipts(prev => [newReceipt, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recibos</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus size={16} />
            Nuevo Recibo
          </button>
          <button
            onClick={() => setShowMonthlySummary(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <BarChart3 size={16} />
            Resumen Mensual
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-xl p-8 space-y-6">

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">Nuevo Recibo</h3>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            {isUpdateMonth() && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-3 rounded">
                ⚠ Este mes corresponde actualización de alquiler.
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">

              <div>
                <label>Inquilino</label>
                <select
                  className="w-full border p-2 rounded"
                  value={form.tenantId}
                  onChange={e => {
                    const tenant = tenants.find(t => t.id === Number(e.target.value));
                    const property = properties.find(p => p.id === tenant?.propertyId);

                    setForm({
                      ...form,
                      tenantId: e.target.value,
                      rent: property?.rent ?? 0,
                      expenses: property?.expenses ?? 0,
                      previousBalance: tenant?.balance ?? 0
                    });
                  }}
                >
                  <option value="">Seleccionar inquilino</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Mes</label>
                <input
                  className="w-full border p-2 rounded"
                  value={form.month}
                  onChange={e => setForm({...form, month: e.target.value})}
                  placeholder="Ej: Marzo"
                />
              </div>

              <div>
                <label>Año</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={form.year}
                  onChange={e => setForm({...form, year: Number(e.target.value)})}
                />
              </div>

              <div>
                <label>Alquiler</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={form.rent}
                  onChange={e => setForm({...form, rent: Number(e.target.value)})}
                />
              </div>

              <div>
                <label>Expensas</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={form.expenses}
                  onChange={e => setForm({...form, expenses: Number(e.target.value)})}
                />
              </div>

              <div>
                <label>Saldo Anterior</label>
                <input
                  type="number"
                  className="w-full border p-2 rounded"
                  value={form.previousBalance}
                  onChange={e => setForm({...form, previousBalance: Number(e.target.value)})}
                />
              </div>

            </div>

            <div>
              <h4 className="font-semibold">Otros Cargos</h4>
              {form.otherCharges.map((charge: any, index: number) => (
                <div key={index} className="flex gap-3 mt-2">
                  <input
                    placeholder="Descripción"
                    className="flex-1 border p-2 rounded"
                    value={charge.description}
                    onChange={e => {
                      const updated = [...form.otherCharges];
                      updated[index].description = e.target.value;
                      setForm({...form, otherCharges: updated});
                    }}
                  />
                  <input
                    type="number"
                    placeholder="Monto"
                    className="w-32 border p-2 rounded"
                    value={charge.amount}
                    onChange={e => {
                      const updated = [...form.otherCharges];
                      updated[index].amount = e.target.value;
                      setForm({...form, otherCharges: updated});
                    }}
                  />
                </div>
              ))}

              <button
                onClick={() =>
                  setForm({
                    ...form,
                    otherCharges: [...form.otherCharges, { description: '', amount: 0 }]
                  })
                }
                className="text-blue-600 mt-2"
              >
                + Agregar cargo
              </button>
            </div>

            <div className="text-right font-semibold text-lg">
              Total: ${total.toLocaleString()}
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Generar Recibo
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