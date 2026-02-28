import React, { useState, useMemo } from 'react';
import { Plus, BarChart3, Eye, Printer, X } from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';
import MonthlySummary from './MonthlySummary';
import { generateObligations, calculateTenantFinancialStatus } from '../utils/financialEngine';

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

  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [paidAmount, setPaidAmount] = useState(0);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  /* ==============================
     MOTOR FINANCIERO REAL
     ============================== */

  const obligations = useMemo(() => {
    return generateObligations(tenants, properties);
  }, [tenants, properties]);

  const payments = useMemo(() => {
    return receipts.map(r => {
      const tenant = tenants.find(t => t.name === r.tenant);
      return {
        tenantId: tenant?.id ?? 0,
        amount: Number(r.paidAmount ?? 0)
      };
    }).filter(p => p.tenantId !== 0);
  }, [receipts, tenants]);

  const selectedTenant = tenants.find(t => t.id === selectedTenantId);

  const financialStatus = selectedTenant
    ? calculateTenantFinancialStatus(selectedTenant.id, obligations, payments)
    : null;

  const rent = selectedTenant
    ? properties.find(p => p.id === selectedTenant.propertyId)?.rent || 0
    : 0;

  const expenses = selectedTenant
    ? properties.find(p => p.id === selectedTenant.propertyId)?.expenses || 0
    : 0;

  const previousDebt = financialStatus?.balance || 0;

  const total = rent + expenses + previousDebt;

  const remaining = total - paidAmount;

  /* ==============================
     AVISO ACTUALIZACIÓN
     ============================== */

  const shouldUpdateContract = () => {
    if (!selectedTenant?.updateFrequencyMonths || !selectedTenant.contractStart) return false;

    const start = new Date(selectedTenant.contractStart);
    const current = new Date(`${selectedMonth} 1, ${selectedYear}`);

    const diffMonths =
      (current.getFullYear() - start.getFullYear()) * 12 +
      (current.getMonth() - start.getMonth());

    return diffMonths > 0 && diffMonths % selectedTenant.updateFrequencyMonths === 0;
  };

  /* ==============================
     GENERAR RECIBO
     ============================== */

  const handleGenerate = () => {

    if (!selectedTenant) return;

    if (shouldUpdateContract()) {
      alert('⚠ Este contrato debe actualizarse este mes. Verifique el monto.');
    }

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `R-${Date.now()}`,
      tenant: selectedTenant.name,
      property: selectedTenant.property,
      building: '',
      month: selectedMonth,
      year: selectedYear,
      rent,
      expenses,
      otherCharges: [],
      previousBalance: previousDebt,
      total,
      paidAmount,
      remainingBalance: remaining,
      currency: 'ARS',
      paymentMethod: 'efectivo',
      status: remaining > 0 ? 'pendiente' : 'pagado',
      dueDate: '',
      createdDate: new Date().toISOString().split('T')[0]
    };

    setReceipts(prev => [newReceipt, ...prev]);

    updateTenantBalance(selectedTenant.name, remaining);

    if (paidAmount > 0) {
      addCashMovement({
        type: 'income',
        description: `Cobro ${selectedTenant.name}`,
        amount: paidAmount,
        currency: 'ARS',
        date: new Date().toISOString().split('T')[0],
        tenant: selectedTenant.name,
        property: selectedTenant.property
      });
    }

    setShowGenerator(false);
    setPaidAmount(0);
  };

  /* ==============================
     IMPRESIÓN
     ============================== */

  const printReceipt = (receipt: Receipt) => {
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
      <body>
        <h1>Recibo ${receipt.receiptNumber}</h1>
        <p>Inquilino: ${receipt.tenant}</p>
        <p>Total: $${receipt.total}</p>
        <p>Pagado: $${receipt.paidAmount}</p>
        <p>Saldo: $${receipt.remainingBalance}</p>
      </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Recibos</h2>
        <div className="flex gap-3">
          <button onClick={() => setShowGenerator(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex gap-2">
            <Plus className="h-4 w-4" />
            Generar Recibo
          </button>
          <button onClick={() => setShowMonthlySummary(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg">
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabla Recibos */}
      <div className="bg-white rounded-xl shadow border">
        <table className="min-w-full">
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="hover:bg-blue-50">
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td>{r.tenant}</td>
                <td>${r.total}</td>
                <td>
                  <button onClick={() => setSelectedReceipt(r)}>
                    <Eye className="h-4 w-4 text-blue-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Generador */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">
            <h3 className="font-semibold">Generar Recibo</h3>

            <select onChange={e => setSelectedTenantId(Number(e.target.value))} className="w-full border p-2 rounded">
              <option>Seleccionar Inquilino</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>

            <input type="text" placeholder="Mes" onChange={e => setSelectedMonth(e.target.value)} className="w-full border p-2 rounded" />
            <input type="number" value={paidAmount} onChange={e => setPaidAmount(Number(e.target.value))} className="w-full border p-2 rounded" placeholder="Monto pagado" />

            <div className="bg-gray-50 p-3 rounded">
              <p>Deuda anterior: ${previousDebt}</p>
              <p>Alquiler: ${rent}</p>
              <p>Expensas: ${expenses}</p>
              <p className="font-semibold">Total: ${total}</p>
              <p className="font-semibold text-red-600">Saldo restante: ${remaining}</p>
            </div>

            <button onClick={handleGenerate} className="bg-blue-600 text-white w-full py-2 rounded">
              Confirmar
            </button>
          </div>
        </div>
      )}

      {/* Modal Ver Recibo */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3>{selectedReceipt.receiptNumber}</h3>
            <p>Total: ${selectedReceipt.total}</p>
            <button onClick={() => printReceipt(selectedReceipt)} className="bg-green-600 text-white px-4 py-2 rounded">
              Imprimir
            </button>
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