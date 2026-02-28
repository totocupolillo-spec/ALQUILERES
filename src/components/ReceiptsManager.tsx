import React, { useState } from 'react';
import { BarChart3, Eye, Printer, X } from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';
import MonthlySummary from './MonthlySummary';

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
  receipts
}) => {

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  /* =================================
     🔥 AVISO DE ACTUALIZACIÓN
     ================================= */

  const shouldUpdateContract = (tenantName: string, month: string, year: number) => {

    const tenant = tenants.find(t => t.name === tenantName);
    if (!tenant || !tenant.updateFrequencyMonths || !tenant.contractStart) return false;

    const start = new Date(tenant.contractStart);
    const current = new Date(`${month} 1, ${year}`);

    const diffMonths =
      (current.getFullYear() - start.getFullYear()) * 12 +
      (current.getMonth() - start.getMonth());

    return diffMonths > 0 && diffMonths % tenant.updateFrequencyMonths === 0;
  };

  const printReceipt = (receipt: Receipt) => {

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Recibo ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial; padding:40px; }
            h1 { margin-bottom:10px; }
          </style>
        </head>
        <body>
          <h1>RECIBO N° ${receipt.receiptNumber}</h1>
          <p><strong>Inquilino:</strong> ${receipt.tenant}</p>
          <p><strong>Propiedad:</strong> ${receipt.property}</p>
          <p><strong>Periodo:</strong> ${receipt.month} ${receipt.year}</p>
          <p><strong>Total:</strong> ${receipt.currency} $${receipt.total.toLocaleString()}</p>
          <p><strong>Pagado:</strong> ${receipt.currency} $${receipt.paidAmount.toLocaleString()}</p>
          <p><strong>Saldo:</strong> ${receipt.currency} $${receipt.remainingBalance.toLocaleString()}</p>
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

        <button
          onClick={() => setShowMonthlySummary(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <BarChart3 className="h-4 w-4" />
          Resumen Mensual
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Recibo</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Estado</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => {

              const updateWarning = shouldUpdateContract(r.tenant, r.month, r.year);

              return (
                <tr key={r.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">{r.receiptNumber}</td>
                  <td className="px-6 py-4">
                    {r.tenant}
                    {updateWarning && (
                      <div className="text-xs text-orange-600 font-semibold">
                        ⚠ Requiere actualización
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {r.currency} ${r.total.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      r.remainingBalance > 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {r.remainingBalance > 0 ? 'Pendiente' : 'Pagado'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedReceipt(r)}
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

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">
                Recibo N° {selectedReceipt.receiptNumber}
              </h3>
              <button onClick={() => setSelectedReceipt(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p><strong>Inquilino:</strong> {selectedReceipt.tenant}</p>
              <p><strong>Propiedad:</strong> {selectedReceipt.property}</p>
              <p><strong>Periodo:</strong> {selectedReceipt.month} {selectedReceipt.year}</p>
              <p><strong>Total:</strong> {selectedReceipt.currency} ${selectedReceipt.total.toLocaleString()}</p>
              <p><strong>Pagado:</strong> {selectedReceipt.currency} ${selectedReceipt.paidAmount.toLocaleString()}</p>
              <p><strong>Saldo:</strong> {selectedReceipt.currency} ${selectedReceipt.remainingBalance.toLocaleString()}</p>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => printReceipt(selectedReceipt)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                <Printer className="h-4 w-4" />
                Imprimir
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