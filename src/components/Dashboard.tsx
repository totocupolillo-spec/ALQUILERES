import React, { useMemo, useState } from 'react';
import {
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  X
} from 'lucide-react';
import { Property, Tenant, Receipt } from '../App';

interface DashboardProps {
  properties?: Property[];
  tenants?: Tenant[];
  receipts?: Receipt[];
}

const Dashboard: React.FC<DashboardProps> = ({ properties = [], tenants = [], receipts = [] }) => {

  const [showDebtorsModal, setShowDebtorsModal] = useState(false);

  const stats = useMemo(() => {

    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const monthReceipts = receipts.filter(r =>
      r.month?.toLowerCase() === currentMonth.toLowerCase() &&
      r.year === currentYear
    );

    const totalIncome = monthReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    const debtors = tenants.map(t => {
      const tenantReceipts = receipts.filter(r => r.tenant === t.name);
      const debt = tenantReceipts.reduce((sum, r) => sum + (r.remainingBalance || 0), 0);
      return { ...t, debt };
    }).filter(t => t.debt > 0)
      .sort((a, b) => b.debt - a.debt);

    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    return {
      totalProperties: properties.length,
      totalTenants: tenants.length,
      totalIncome,
      debtors,
      totalDebt
    };

  }, [properties, tenants, receipts]);

  return (
    <div className="space-y-6">

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Propiedades</p>
              <p className="text-2xl font-bold">{stats.totalProperties}</p>
            </div>
            <Building2 className="text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow border">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-green-600">
                ${stats.totalIncome.toLocaleString()}
              </p>
            </div>
            <DollarSign className="text-green-600" />
          </div>
        </div>

        <div
          onClick={() => setShowDebtorsModal(true)}
          className="bg-white p-6 rounded-xl shadow border cursor-pointer hover:bg-red-50 transition"
        >
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.debtors.length}
              </p>
              <p className="text-sm text-red-600">
                ${stats.totalDebt.toLocaleString()}
              </p>
            </div>
            <AlertTriangle className="text-red-600" />
          </div>
        </div>

      </div>

      {/* Deudores Modal */}
      {showDebtorsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl p-6 rounded-xl">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Detalle de Deudores</h3>
              <button onClick={() => setShowDebtorsModal(false)}>
                <X />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {stats.debtors.map(d => (
                <div key={d.id} className="p-3 bg-red-50 rounded-lg flex justify-between">
                  <div>
                    <p className="font-medium">{d.name}</p>
                    <p className="text-sm text-gray-500">{d.property}</p>
                  </div>
                  <div className="font-semibold text-red-600">
                    ${d.debt.toLocaleString()}
                  </div>
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