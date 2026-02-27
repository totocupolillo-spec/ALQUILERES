import React, { useMemo } from 'react';
import { Building2, Users, FileText, AlertTriangle, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Property, Tenant, Receipt } from '../App';

interface DashboardProps {
  properties: Property[];
  tenants: Tenant[];
  receipts: Receipt[];
  setActiveTab?: (tab: any) => void; // ✅ opcional para evitar romper App
}

const Dashboard: React.FC<DashboardProps> = ({ properties, tenants, receipts }) => {
  const stats = useMemo(() => {
    const totalProperties = properties.length;
    const occupiedProperties = properties.filter(p => p.status === 'ocupado').length;
    const availableProperties = properties.filter(p => p.status === 'disponible').length;
    const totalTenants = tenants.length;

    const currentMonth = new Date().toLocaleString('es-ES', { month: 'long' });
    const currentYear = new Date().getFullYear();

    const monthReceipts = receipts.filter(r =>
      r.month.toLowerCase() === currentMonth.toLowerCase() && r.year === currentYear
    );

    const totalIncome = monthReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

    // Deudores: priorizamos tenant.balance, pero si viene en 0 y hay recibos con saldo, tomamos el mas reciente.
    const latestDebtByTenant = new Map<string, number>();
    const latestDateByTenant = new Map<string, number>();

    receipts.forEach(r => {
      if (!r.tenant) return;
      const hasDebt = (r.remainingBalance || 0) > 0;
      if (!hasDebt) return;
      const dateNum = new Date(r.createdDate).getTime();
      const prev = latestDateByTenant.get(r.tenant);
      if (!prev || dateNum >= prev) {
        latestDateByTenant.set(r.tenant, dateNum);
        latestDebtByTenant.set(r.tenant, r.remainingBalance || 0);
      }
    });

    const debtors = tenants
      .map(t => {
        const fallback = latestDebtByTenant.get(t.name) ?? 0;
        const debt = Math.max(t.balance || 0, fallback);
        return { tenant: t, debt };
      })
      .filter(x => x.debt > 0)
      .sort((a, b) => b.debt - a.debt);

    const pendingPayments = debtors.length;
    const totalDebt = debtors.reduce((sum, d) => sum + d.debt, 0);

    const recentReceipts = receipts
      .slice()
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
      .slice(0, 5);

    return {
      totalProperties,
      occupiedProperties,
      availableProperties,
      totalTenants,
      totalIncome,
      pendingPayments,
      totalDebt,
      recentReceipts,
      debtors
    };
  }, [properties, tenants, receipts]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Propiedades</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-green-600">{stats.occupiedProperties} Ocupadas</span>
            <span className="text-gray-500">{stats.availableProperties} Disponibles</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Inquilinos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTenants}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span>Activos en el sistema</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ingresos del Mes</p>
              <p className="text-2xl font-bold text-gray-900">${stats.totalIncome.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span>Cobranzas registradas</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagos Pendientes</p>
              <p className="text-2xl font-bold text-red-600">{stats.pendingPayments}</p>
            </div>
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <span>Deuda total: <strong className="text-red-600">${stats.totalDebt.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recibos Recientes</h3>
          </div>

          <div className="space-y-3">
            {stats.recentReceipts.map((receipt) => (
              <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{receipt.tenant}</p>
                  <p className="text-sm text-gray-600">{receipt.property} - {receipt.month} {receipt.year}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${receipt.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${receipt.status === 'pagado'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {receipt.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            ))}

            {stats.recentReceipts.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay recibos registrados</p>
            )}
          </div>
        </div>

        {/* Debtors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Clientes que Deben</h3>
          </div>

          <div className="space-y-3">
            {stats.debtors.slice(0, 8).map(({ tenant, debt }) => (
              <div key={tenant.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div>
                  <p className="font-medium text-gray-900">{tenant.name}</p>
                  <p className="text-sm text-gray-600">{tenant.property || 'Sin propiedad'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-700">${debt.toLocaleString()}</p>
                  <p className="text-xs text-red-600">Pendiente</p>
                </div>
              </div>
            ))}

            {stats.debtors.length === 0 && (
              <p className="text-gray-500 text-center py-4">No hay deudores registrados</p>
            )}

            {stats.debtors.length > 8 && (
              <p className="text-xs text-gray-500">Mostrando 8 de {stats.debtors.length} deudores</p>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming Dues */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Próximos Vencimientos</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-sm font-medium text-orange-800">Esta Semana</p>
            <p className="text-2xl font-bold text-orange-900">{Math.min(stats.pendingPayments, 3)}</p>
            <p className="text-sm text-orange-700">Vencimientos próximos</p>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-800">Este Mes</p>
            <p className="text-2xl font-bold text-yellow-900">{Math.min(stats.pendingPayments, 7)}</p>
            <p className="text-sm text-yellow-700">Pagos pendientes</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800">Al Día</p>
            <p className="text-2xl font-bold text-green-900">{stats.totalTenants - stats.pendingPayments}</p>
            <p className="text-sm text-green-700">Inquilinos al corriente</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;