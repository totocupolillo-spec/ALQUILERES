import React, { useMemo, useState } from 'react';
import { Plus, User, Edit, Trash2 } from 'lucide-react';
import { Tenant, Property, Receipt } from '../App';
import { generateObligations, calculateTenantFinancialStatus } from '../utils/financialEngine';

interface TenantsManagerProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  properties: Property[];
  receipts: Receipt[];   // 🔵 IMPORTANTE
  updatePropertyTenant: (propertyId: number | null, tenantName: string | null, oldPropertyId?: number | null) => void;
}

const TenantsManager: React.FC<TenantsManagerProps> = ({
  tenants,
  setTenants,
  properties,
  receipts,
  updatePropertyTenant
}) => {

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  /* =========================
     🔵 MOTOR FINANCIERO REAL
     ========================= */

  const obligations = useMemo(() => {
    return generateObligations(tenants, properties);
  }, [tenants, properties]);

  // 🔵 Convertimos recibos en pagos reales
  const payments = useMemo(() => {
    return receipts.map(r => {
      const tenant = tenants.find(t => t.name === r.tenant);
      return {
        tenantId: tenant?.id ?? 0,
        amount: Number(r.paidAmount ?? 0)
      };
    }).filter(p => p.tenantId !== 0);
  }, [receipts, tenants]);

  const financialStatusMap = useMemo(() => {
    const map: Record<number, ReturnType<typeof calculateTenantFinancialStatus>> = {};
    tenants.forEach((tenant) => {
      map[tenant.id] = calculateTenantFinancialStatus(
        tenant.id,
        obligations,
        payments
      );
    });
    return map;
  }, [tenants, obligations, payments]);

  /* =========================
     CRUD
     ========================= */

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este inquilino?')) {
      const tenant = tenants.find((t) => t.id === id);
      if (tenant?.propertyId) {
        updatePropertyTenant(null, null, tenant.propertyId);
      }
      setTenants(tenants.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Inquilinos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Inquilino</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propiedad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo Real</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {tenants.map((tenant) => {
              const status = financialStatusMap[tenant.id];
              const balance = status?.balance ?? 0;

              return (
                <tr key={tenant.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 font-medium">{tenant.name}</td>
                  <td className="px-6 py-4">{tenant.property || '-'}</td>
                  <td className="px-6 py-4 font-semibold">
                    {balance > 0 ? (
                      <span className="text-red-600">
                        Debe ${balance.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-green-600">
                        Al día
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {balance > 0 ? (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                        Deudor
                      </span>
                    ) : (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Al día
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="text-blue-600 hover:text-blue-800">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(tenant.id)} className="text-red-600 hover:text-red-800">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>

        </table>
      </div>

    </div>
  );
};

export default TenantsManager;