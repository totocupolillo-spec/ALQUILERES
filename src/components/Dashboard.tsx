import React, { useState } from 'react';
import { Building2, Users, DollarSign, AlertTriangle, TrendingUp, Calendar, Eye, X } from 'lucide-react';
import { Tenant, Receipt, Property } from '../App';

type TabType = 'dashboard' | 'properties' | 'tenants' | 'receipts' | 'history' | 'cash';

interface DashboardProps {
  tenants: Tenant[];
  receipts: Receipt[];
  properties: Property[];
  setActiveTab: (tab: TabType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tenants, receipts, properties, setActiveTab }) => {
  const [showPendingDetails, setShowPendingDetails] = useState(false);

  // Calcular pagos pendientes basado en datos reales
  const pendingPayments = tenants
    .filter(tenant => tenant.balance > 0)
    .map(tenant => {
      const today = new Date();
      const contractEnd = new Date(tenant.contractEnd);
      const daysOverdue = Math.max(0, Math.floor((today.getTime() - contractEnd.getTime()) / (1000 * 60 * 60 * 24)));
      
      return {
        id: tenant.id,
        tenant: tenant.name,
        property: tenant.property,
        amount: tenant.balance,
        dueDate: tenant.contractEnd,
        daysOverdue
      };
    });

  const totalPendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calcular estadísticas reales
  const totalProperties = properties.length;
  const activeTenants = tenants.filter(t => t.status === 'activo').length;
  const occupancyRate = totalProperties > 0 ? ((activeTenants / totalProperties) * 100).toFixed(1) : '0';
  
  // Calcular ingresos del mes actual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyIncome = receipts
    .filter(receipt => {
      const receiptDate = new Date(receipt.createdDate);
      return receiptDate.getMonth() === currentMonth && 
             receiptDate.getFullYear() === currentYear &&
             receipt.status === 'pagado';
    })
    .reduce((sum, receipt) => sum + receipt.paidAmount, 0);

  const stats = [
    {
      title: 'Propiedades Totales',
      value: totalProperties.toString(),
      icon: Building2,
      color: 'bg-blue-500',
      change: '+2 este mes'
    },
    {
      title: 'Inquilinos Activos',
      value: activeTenants.toString(),
      icon: Users,
      color: 'bg-green-500',
      change: `${occupancyRate}% ocupación`
    },
    {
      title: 'Ingresos del Mes',
      value: `$${monthlyIncome.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: '+12% vs mes anterior'
    },
    {
      title: 'Pagos Pendientes',
      value: `${pendingPayments.length}`,
      icon: AlertTriangle,
      color: 'bg-red-500',
      change: `$${totalPendingAmount.toLocaleString()} total`,
      clickable: true
    }
  ];

  // Obtener pagos recientes de los recibos
  const recentPayments = receipts
    .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
    .slice(0, 4)
    .map(receipt => ({
      id: receipt.id,
      tenant: receipt.tenant,
      property: receipt.property,
      amount: receipt.paidAmount,
      date: receipt.createdDate,
      status: receipt.status === 'pagado' ? 'paid' : 'pending'
    }));

  // Próximos vencimientos basado en contratos
  const upcomingDues = tenants
    .filter(tenant => tenant.status === 'activo')
    .sort((a, b) => new Date(a.contractEnd).getTime() - new Date(b.contractEnd).getTime())
    .slice(0, 3)
    .map(tenant => ({
      id: tenant.id,
      tenant: tenant.name,
      property: tenant.property,
      amount: 28000, // Esto debería venir de la propiedad
      dueDate: tenant.contractEnd
    }));

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${
                stat.clickable ? 'cursor-pointer hover:bg-gray-50' : ''
              }`}
              onClick={stat.clickable ? () => setShowPendingDetails(true) : undefined}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Payments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Pagos Recientes</h3>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{payment.tenant}</p>
                    <p className="text-sm text-gray-500">{payment.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status === 'paid' ? 'Pagado' : 'Pendiente'}
                      </span>
                      <span className="text-xs text-gray-500">{payment.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Due Dates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Próximos Vencimientos</h3>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingDues.map((due) => (
                <div key={due.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{due.tenant}</p>
                    <p className="text-sm text-gray-500">{due.property}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${due.amount.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Vence: {due.dueDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => setActiveTab('properties')}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Building2 className="h-5 w-5" />
            <span>Agregar Propiedad</span>
          </button>
          <button 
            onClick={() => setActiveTab('tenants')}
            className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Users className="h-5 w-5" />
            <span>Nuevo Inquilino</span>
          </button>
          <button 
            onClick={() => setActiveTab('receipts')}
            className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <DollarSign className="h-5 w-5" />
            <span>Generar Recibo</span>
          </button>
        </div>
      </div>

      {/* Pending Payments Modal */}
      {showPendingDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Detalle de Pagos Pendientes</h3>
              <button
                onClick={() => setShowPendingDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{payment.tenant}</h4>
                      <p className="text-sm text-gray-600">{payment.property}</p>
                      <p className="text-xs text-gray-500">Vencimiento: {payment.dueDate}</p>
                      {payment.daysOverdue > 0 && (
                        <p className="text-xs text-red-600 font-medium">
                          {payment.daysOverdue} días de atraso
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${payment.amount.toLocaleString()}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        payment.daysOverdue > 0 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.daysOverdue > 0 ? 'Vencido' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Pendiente:</span>
                <span className="text-xl font-bold text-red-600">${totalPendingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;