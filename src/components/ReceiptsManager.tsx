import React, { useState, useEffect } from 'react';
import { Plus, FileText, Search, Filter, X, Printer, BarChart3, Eye } from 'lucide-react';
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

const safeNumber = (value: any) => Number(value ?? 0);

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({
  tenants,
  properties,
  receipts,
  setReceipts,
  addCashMovement,
  updateTenantBalance
}) => {

  const [showModal, setShowModal] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  // 🔒 Normalizamos recibos por si Firebase trae campos faltantes
  const normalizedReceipts: Receipt[] = receipts.map(r => ({
    ...r,
    rent: safeNumber(r.rent),
    expenses: safeNumber(r.expenses),
    previousBalance: safeNumber(r.previousBalance),
    total: safeNumber(r.total),
    paidAmount: safeNumber(r.paidAmount),
    remainingBalance: safeNumber(r.remainingBalance),
    otherCharges: r.otherCharges ?? []
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>
          <p className="text-gray-600">Genera y gestiona los recibos de alquiler</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Generar Recibo</span>
          </button>
          <button
            onClick={() => setShowMonthlySummary(true)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Resumen Mensual</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquilino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {normalizedReceipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {receipt.receiptNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {receipt.tenant}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {receipt.property}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {receipt.month} {receipt.year}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ${safeNumber(receipt.total).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                      {receipt.status}
                    </span>
                  </td>
                </tr>
              ))}
              {normalizedReceipts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No hay recibos cargados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMonthlySummary && (
        <MonthlySummary
          receipts={normalizedReceipts}
          tenants={tenants}
          properties={properties}
          onClose={() => setShowMonthlySummary(false)}
        />
      )}
    </div>
  );
};

export default ReceiptsManager;