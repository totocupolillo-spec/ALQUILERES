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

const months = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({
  tenants,
  properties,
  receipts,
  setReceipts
}) => {

  const [showModal, setShowModal] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

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

  const total = useMemo(() => {
    const extras = form.otherCharges.reduce((acc: number, c: any) => acc + Number(c.amount || 0), 0);
    return Number(form.rent || 0)
      + Number(form.expenses || 0)
      + Number(form.previousBalance || 0)
      + extras;
  }, [form]);

  const handleGenerate = () => {
    if (!selectedTenant || !selectedProperty || !form.month) return;

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `REC-${Date.now()}`,
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

      <div className="flex justify-between">
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
            <BarChart3 size={16}/>
            Resumen Mensual
          </button>
        </div>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Recibo</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Estado</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="hover:bg-blue-50">
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td>{r.tenant}</td>
                <td>${(r.total ?? 0).toLocaleString()}</td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    r.remainingBalance > 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {r.remainingBalance > 0 ? 'Pendiente' : 'Pagado'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL PROFESIONAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl p-8 space-y-6">

            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">Nuevo Recibo</h3>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">

              <div>
                <label className="block text-sm mb-1">Inquilino</label>
                <select
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
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Seleccionar inquilino</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Mes</label>
                <select
                  value={form.month}
                  onChange={e => setForm({...form, month: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="">Seleccionar mes</option>
                  {months.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Alquiler</label>
                <input
                  type="number"
                  value={form.rent}
                  onChange={e => setForm({...form, rent: Number(e.target.value)})}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Expensas</label>
                <input
                  type="number"
                  value={form.expenses}
                  onChange={e => setForm({...form, expenses: Number(e.target.value)})}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Saldo Anterior</label>
                <input
                  type="number"
                  value={form.previousBalance}
                  onChange={e => setForm({...form, previousBalance: Number(e.target.value)})}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Vencimiento</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({...form, dueDate: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

            </div>

            <div className="text-right text-xl font-bold">
              Total: ${total.toLocaleString()}
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 border rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={handleGenerate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg"
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