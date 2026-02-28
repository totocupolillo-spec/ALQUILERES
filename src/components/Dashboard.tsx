import React, { useMemo, useState } from 'react';
import { Building2, Users, DollarSign, AlertTriangle, X } from 'lucide-react';
import { Property, Tenant, Receipt } from '../App';

interface DashboardProps {
  properties: Property[];
  tenants: Tenant[];
  receipts: Receipt[];
  setActiveTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  properties,
  tenants,
  receipts
}) => {

  const [showIncomeDetail, setShowIncomeDetail] = useState(false);
  const [showDebtDetail, setShowDebtDetail] = useState(false);

  const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
  const currentYear = new Date().getFullYear();

  const monthReceipts = receipts.filter(r =>
    r.month?.toLowerCase() === currentMonth.toLowerCase() &&
    r.year === currentYear
  );

  const totalIncome = monthReceipts.reduce((sum, r) => sum + r.paidAmount, 0);

  const debtors = tenants.filter(t => t.balance > 0);

  const totalDebt = debtors.reduce((sum, t) => sum + t.balance, 0);

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white rounded-xl shadow border p-6">
          <p className="text-sm text-gray-600">Propiedades</p>
          <p className="text-2xl font-bold">{properties.length}</p>
        </div>

        <div
          onClick={() => setShowIncomeDetail(true)}
          className="bg-green-50 rounded-xl shadow border p-6 cursor-pointer hover:bg-green-100 transition"
        >
          <p className="text-sm text-gray-600">Ingresos del Mes</p>
          <p className="text-2xl font-bold text-green-700">
            ${totalIncome.toLocaleString()}
          </p>
        </div>

        <div
          onClick={() => setShowDebtDetail(true)}
          className="bg-red-50 rounded-xl shadow border p-6 cursor-pointer hover:bg-red-100 transition"
        >
          <p className="text-sm text-gray-600">Pagos Pendientes</p>
          <p className="text-2xl font-bold text-red-700">
            ${totalDebt.toLocaleString()}
          </p>
        </div>

      </div>

      {/* 🔥 MODAL INGRESOS */}
      {showIncomeDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Detalle Ingresos</h3>
              <button onClick={() => setShowIncomeDetail(false)}>
                <X />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {monthReceipts.map(r => (
                <div key={r.id} className="flex justify-between">
                  <span>{r.tenant}</span>
                  <span className="text-green-600">
                    ${r.paidAmount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 MODAL DEUDORES */}
      {showDebtDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Detalle Deudores</h3>
              <button onClick={() => setShowDebtDetail(false)}>
                <X />
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {debtors.map(t => (
                <div key={t.id} className="flex justify-between">
                  <span>{t.name}</span>
                  <span className="text-red-600">
                    ${t.balance.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;