import React, { useState, useMemo } from 'react';
import { Plus, Eye, Printer, X, BarChart3 } from 'lucide-react';
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
  setReceipts,
  addCashMovement,
  updateTenantBalance,
  supabaseHook,
  user
}) => {

  const [showMonthlySummary, setShowMonthlySummary] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const printReceipt = (receipt: Receipt) => {
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <body style="font-family: Arial; padding:40px">
          <h2>Recibo ${receipt.receiptNumber}</h2>
          <p><strong>Inquilino:</strong> ${receipt.tenant}</p>
          <p><strong>Propiedad:</strong> ${receipt.property}</p>
          <p><strong>Total:</strong> $${receipt.total.toLocaleString()}</p>
          <p><strong>Pagado:</strong> $${receipt.paidAmount.toLocaleString()}</p>
          <p><strong>Saldo:</strong> $${receipt.remainingBalance.toLocaleString()}</p>
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
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="hover:bg-blue-50">
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td>{r.tenant}</td>
                <td>${r.total.toLocaleString()}</td>
                <td>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    r.remainingBalance > 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {r.remainingBalance > 0 ? 'Pendiente' : 'Pagado'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => setSelectedReceipt(r)}
                    className="text-blue-600"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h3 className="mb-4 font-semibold">
              Recibo {selectedReceipt.receiptNumber}
            </h3>

            <div className="space-y-2">
              <p><strong>Total:</strong> ${selectedReceipt.total}</p>
              <p><strong>Pagado:</strong> ${selectedReceipt.paidAmount}</p>
              <p><strong>Saldo:</strong> ${selectedReceipt.remainingBalance}</p>
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