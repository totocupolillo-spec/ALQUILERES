import React, { useMemo, useState } from 'react';
import { Building2, Users, FileText, AlertTriangle, TrendingUp, Calendar, DollarSign, X } from 'lucide-react';
import { Property, Tenant, Receipt } from '../App';

interface DashboardProps {
  properties?: Property[];
  tenants?: Tenant[];
  receipts?: Receipt[];
}

const Dashboard: React.FC<DashboardProps> = ({ properties, tenants, receipts }) => {

  const [modalType, setModalType] = useState<'income' | 'debt' | 'pending' | null>(null);

  const safeProperties = properties ?? [];
  const safeTenants = tenants ?? [];
  const safeReceipts = receipts ?? [];

  const stats = useMemo(() => {

    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const monthReceipts = safeReceipts.filter(r =>
      (r.month || '').toLowerCase() === currentMonth.toLowerCase() &&
      r.year === currentYear
    );

    const totalIncome = monthReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    const debtMap = new Map<string, number>();

    safeReceipts.forEach(r => {
      if ((r.remainingBalance || 0) > 0) {
        const prev = debtMap.get(r.tenant) || 0;
        debtMap.set(r.tenant, prev + (r.remainingBalance || 0));
      }
    });

    const debtors = Array.from(debtMap.entries()).map(([tenant, debt]) => ({
      tenant,
      debt
    })).sort((a, b) => b.debt - a.debt);

    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    return {
      totalProperties: safeProperties.length,
      totalTenants: safeTenants.length,
      totalIncome,
      totalDebt,
      pendingPayments: debtors.length,
      debtors,
      monthReceipts
    };

  }, [safeProperties, safeTenants, safeReceipts]);

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600">Propiedades</p>
          <p className="text-2xl font-bold">{stats.totalProperties}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <p className="text-sm text-gray-600">Inquilinos</p>
          <p className="text-2xl font-bold">{stats.totalTenants}</p>
        </div>

        <div
          onClick={() => setModalType('income')}
          className="bg-blue-50 border border-blue-200 rounded-xl shadow-sm p-6 cursor-pointer hover:bg-blue-100 transition"
        >
          <p className="text-sm text-blue-600">Ingresos del Mes</p>
          <p className="text-2xl font-bold text-blue-900">
            ${stats.totalIncome.toLocaleString()}
          </p>
        </div>

        <div
          onClick={() => setModalType('debt')}
          className="bg-red-50 border border-red-200 rounded-xl shadow-sm p-6 cursor-pointer hover:bg-red-100 transition"
        >
          <p className="text-sm text-red-600">Total Adeudado</p>
          <p className="text-2xl font-bold text-red-800">
            ${stats.totalDebt.toLocaleString()}
          </p>
          <p className="text-xs text-red-600">
            {stats.pendingPayments} deudores
          </p>
        </div>

      </div>

      {/* Deudores con scroll */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Clientes que Deben</h3>

        <div className="max-h-72 overflow-y-auto space-y-3 pr-2">
          {stats.debtors.map(({ tenant, debt }) => (
            <div key={tenant} className="flex justify-between bg-red-50 p-3 rounded-lg">
              <span>{tenant}</span>
              <span className="text-red-700 font-semibold">
                ${debt.toLocaleString()}
              </span>
            </div>
          ))}

          {stats.debtors.length === 0 && (
            <p className="text-gray-500 text-center">No hay deudores</p>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">

            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {modalType === 'income' && 'Detalle Ingresos'}
                {modalType === 'debt' && 'Detalle Deudores'}
              </h3>
              <button onClick={() => setModalType(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalType === 'income' && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.monthReceipts.map(r => (
                  <div key={r.id} className="flex justify-between border-b pb-2">
                    <span>{r.tenant}</span>
                    <span className="text-blue-700 font-semibold">
                      ${Number(r.paidAmount).toLocaleString()}
                    </span>
                  </div>
                ))}
                {stats.monthReceipts.length === 0 && (
                  <p className="text-gray-500 text-center">No hay ingresos este mes</p>
                )}
              </div>
            )}

            {modalType === 'debt' && (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {stats.debtors.map(d => (
                  <div key={d.tenant} className="flex justify-between border-b pb-2">
                    <span>{d.tenant}</span>
                    <span className="text-red-700 font-semibold">
                      ${d.debt.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;