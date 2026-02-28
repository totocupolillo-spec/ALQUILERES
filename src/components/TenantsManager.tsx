import React, { useMemo, useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
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

  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState<Partial<Tenant>>({
    name: '',
    propertyId: null,
    updateFrequencyMonths: 12
  });

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

  /* =========================
     GUARDAR
     ========================= */

  const handleSave = () => {

    if (!formData.name) return;

    if (editingTenant) {
      setTenants(prev =>
        prev.map(t => t.id === editingTenant.id ? { ...t, ...formData } as Tenant : t)
      );
    } else {
      const newTenant: Tenant = {
        id: Date.now(),
        name: formData.name || '',
        email: '',
        phone: '',
        propertyId: formData.propertyId ?? null,
        property: '',
        contractStart: '',
        contractEnd: '',
        updateFrequencyMonths: formData.updateFrequencyMonths ?? 12,
        deposit: 0,
        guarantor: { name: '', email: '', phone: '' },
        balance: 0,
        status: 'activo'
      };

      setTenants(prev => [...prev, newTenant]);
    }

    setShowModal(false);
    setEditingTenant(null);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar inquilino?')) {
      setTenants(tenants.filter(t => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inquilinos</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          <Plus className="h-4 w-4" />
          Agregar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-blue-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs uppercase">Nombre</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Saldo Real</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Actualiza</th>
              <th className="px-6 py-3 text-left text-xs uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => {
              const balance = financialStatusMap[tenant.id]?.balance ?? 0;

              return (
                <tr key={tenant.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4">{tenant.name}</td>
                  <td className="px-6 py-4 font-semibold">
                    {balance > 0
                      ? <span className="text-red-600">Debe ${balance.toLocaleString()}</span>
                      : <span className="text-green-600">Al día</span>
                    }
                  </td>
                  <td className="px-6 py-4">
                    Cada {tenant.updateFrequencyMonths || 12} meses
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => { setEditingTenant(tenant); setFormData(tenant); setShowModal(true); }}>
                      <Edit className="h-4 w-4 text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(tenant.id)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h3 className="font-semibold">Inquilino</h3>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <input
                placeholder="Nombre"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full border px-3 py-2 rounded-lg"
              />

              <input
                type="number"
                placeholder="Actualiza cada X meses"
                value={formData.updateFrequencyMonths || 12}
                onChange={e => setFormData({ ...formData, updateFrequencyMonths: Number(e.target.value) })}
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TenantsManager;