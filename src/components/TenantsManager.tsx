import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X, Eye } from 'lucide-react';
import { Tenant, Property, Receipt } from '../App';
import { generateObligations, calculateTenantFinancialStatus } from '../utils/financialEngine';

interface TenantsManagerProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  properties: Property[];
  receipts: Receipt[];
  updatePropertyTenant: (propertyId: number | null, tenantName: string | null, oldPropertyId?: number | null) => void;
}

const TenantsManager: React.FC<TenantsManagerProps> = ({
  tenants,
  setTenants,
  properties,
  receipts,
  updatePropertyTenant
}) => {

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const obligations = useMemo(() => {
    return generateObligations(tenants, properties);
  }, [tenants, properties]);

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
    const map: any = {};
    tenants.forEach((tenant) => {
      map[tenant.id] = calculateTenantFinancialStatus(
        tenant.id,
        obligations,
        payments
      );
    });
    return map;
  }, [tenants, obligations, payments]);

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Inquilinos</h2>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Saldo</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => {

              const balance = financialStatusMap[t.id]?.balance ?? 0;

              return (
                <tr key={t.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 font-medium">{t.name}</td>
                  <td className="px-6 py-4">
                    {balance > 0
                      ? <span className="text-red-600">Debe ${balance.toLocaleString()}</span>
                      : <span className="text-green-600">Al día</span>
                    }
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => setSelectedTenant(t)}>
                      <Eye className="h-4 w-4 text-blue-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL DETALLE INQUILINO */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl p-6 rounded-xl">

            <div className="flex justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {selectedTenant.name}
              </h3>
              <button onClick={() => setSelectedTenant(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-medium">
                  Estado: {financialStatusMap[selectedTenant.id]?.balance > 0 ? "Deudor" : "Al día"}
                </p>
                <p className="text-sm">
                  Saldo: ${financialStatusMap[selectedTenant.id]?.balance.toLocaleString() ?? 0}
                </p>
              </div>

              <div className="max-h-72 overflow-y-auto border rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-xs text-left">Fecha</th>
                      <th className="px-4 py-2 text-xs text-left">Periodo</th>
                      <th className="px-4 py-2 text-xs text-left">Total</th>
                      <th className="px-4 py-2 text-xs text-left">Pagado</th>
                      <th className="px-4 py-2 text-xs text-left">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts
                      .filter(r => r.tenant === selectedTenant.name)
                      .map(r => (
                        <tr key={r.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">{r.createdDate}</td>
                          <td className="px-4 py-2 text-sm">{r.month} {r.year}</td>
                          <td className="px-4 py-2 text-sm">${r.total.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-green-600">${r.paidAmount.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-red-600">${r.remainingBalance.toLocaleString()}</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default TenantsManager;