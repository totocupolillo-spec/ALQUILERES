import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Tenant, Property } from '../types';
import { Receipt } from '../App';
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

  /* =========================
     MOTOR FINANCIERO
     ========================= */

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

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar inquilino?')) {
      const tenant = tenants.find(t => t.id === id);
      if (tenant?.propertyId) {
        updatePropertyTenant(null, null, tenant.propertyId);
      }
      setTenants(prev => prev.filter(t => t.id !== id));
    }
  };

  const getTenantReceipts = (tenantName: string) => {
    return receipts.filter(r => r.tenant === tenantName);
  };

  return (
    <div className="space-y-6">

      <h2 className="text-2xl font-bold">Inquilinos</h2>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Inquilino</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Propiedad</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Saldo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => {
              const status = financialStatusMap[tenant.id];
              const balance = status?.balance ?? 0;

              return (
                <tr key={tenant.id} className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => setSelectedTenant(tenant)}>
                  <td className="px-6 py-4 font-medium">{tenant.name}</td>
                  <td>{tenant.property || '-'}</td>
                  <td className="font-semibold">
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
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tenant.id);
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🔥 MODAL DETALLE FINANCIERO */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl space-y-6">

            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                {selectedTenant.name}
              </h3>
              <button onClick={() => setSelectedTenant(null)}>
                <X />
              </button>
            </div>

            {(() => {
              const status = financialStatusMap[selectedTenant.id];
              const receiptsList = getTenantReceipts(selectedTenant.name);

              return (
                <>
                  <div className="grid grid-cols-3 gap-4">

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm">Total Obligación</p>
                      <p className="text-xl font-bold">
                        ${status?.totalObligation.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm">Total Pagado</p>
                      <p className="text-xl font-bold text-green-600">
                        ${status?.totalPaid.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm">Saldo</p>
                      <p className="text-xl font-bold text-red-600">
                        ${status?.balance.toLocaleString()}
                      </p>
                    </div>

                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Historial de Recibos</h4>
                    <div className="max-h-64 overflow-y-auto border rounded-lg">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Recibo</th>
                            <th className="px-4 py-2 text-left">Periodo</th>
                            <th className="px-4 py-2 text-left">Total</th>
                            <th className="px-4 py-2 text-left">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiptsList.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{r.receiptNumber}</td>
                              <td>{r.month} {r.year}</td>
                              <td>${r.total.toLocaleString()}</td>
                              <td className={r.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}>
                                ${r.remainingBalance.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      )}

    </div>
  );
};

export default TenantsManager;