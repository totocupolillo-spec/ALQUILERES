import React, { useState } from 'react';
import { Plus, BarChart3, Eye, Printer, X } from 'lucide-react';
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
  receipts,
  setReceipts,
  addCashMovement,
  updateTenantBalance
}) => {

  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

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
            .box { margin-top:20px; }
          </style>
        </head>
        <body>
          <h1>RECIBO N° ${receipt.receiptNumber}</h1>
          <div class="box">
            <p><strong>Inquilino:</strong> ${receipt.tenant}</p>
            <p><strong>Propiedad:</strong> ${receipt.property}</p>
            <p><strong>Periodo:</strong> ${receipt.month} ${receipt.year}</p>
            <p><strong>Total:</strong> ${receipt.currency} $${receipt.total.toLocaleString()}</p>
            <p><strong>Pagado:</strong> ${receipt.currency} $${receipt.paidAmount.toLocaleString()}</p>
            <p><strong>Saldo:</strong> ${receipt.currency} $${receipt.remainingBalance.toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>

        <div className="flex gap-3">
          <button
            onClick={() => setShowMonthlySummary(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <BarChart3 className="h-4 w-4" />
            Resumen Mensual
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Recibo</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase">Estado</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{r.receiptNumber}</td>
                <td className="px-6 py-4">{r.tenant}</td>
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
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Detalle Recibo */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
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

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => printReceipt(selectedReceipt)}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
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