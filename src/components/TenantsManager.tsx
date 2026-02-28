import React, { useMemo, useState } from 'react';
import { Plus, User, Phone, Mail, Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { Tenant, Property } from '../App';
import { generateObligations, calculateTenantFinancialStatus } from '../utils/financialEngine';

interface TenantsManagerProps {
  tenants: Tenant[];
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  properties: Property[];
  updatePropertyTenant: (propertyId: number | null, tenantName: string | null, oldPropertyId?: number | null) => void;
}

const TenantsManager: React.FC<TenantsManagerProps> = ({
  tenants,
  setTenants,
  properties,
  updatePropertyTenant
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: '',
    contractStart: '',
    contractEnd: '',
    deposit: '',
    guarantorName: '',
    guarantorEmail: '',
    guarantorPhone: '',
  });

  /* =========================
     🔵 MOTOR FINANCIERO REAL
     ========================= */

  const obligations = useMemo(() => {
    return generateObligations(tenants, properties);
  }, [tenants, properties]);

  // ⚠️ Por ahora pagos vacíos (los conectamos en siguiente fase)
  const payments: { tenantId: number; amount: number }[] = [];

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
  }, [tenants, obligations]);

  /* =========================
     Helpers seguros
     ========================= */

  const safeText = (v: unknown, fallback = ''): string =>
    typeof v === 'string' ? v : v == null ? fallback : String(v);

  const safeNumber = (v: unknown, fallback = 0): number => {
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const safeStatus = (v: unknown): Tenant['status'] => {
    const s = safeText(v, 'activo');
    if (s === 'activo' || s === 'vencido' || s === 'pendiente') return s;
    return 'activo';
  };

  const prettyStatus = (statusLike: unknown) => {
    const s = safeText(statusLike, '');
    if (!s) return 'Sin estado';
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  /* =========================
     CRUD
     ========================= */

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProperty = properties.find((p) => String(p.id) === formData.propertyId);
    const oldPropertyId = editingTenant?.propertyId ?? null;

    const newTenant: Tenant = {
      id: editingTenant ? editingTenant.id : Date.now(),
      name: safeText(formData.name),
      email: safeText(formData.email),
      phone: safeText(formData.phone),
      propertyId: formData.propertyId ? parseInt(formData.propertyId, 10) : null,
      property: selectedProperty?.name ?? '',
      contractStart: safeText(formData.contractStart),
      contractEnd: safeText(formData.contractEnd),
      deposit: safeNumber(formData.deposit, 0),
      guarantor: {
        name: safeText(formData.guarantorName),
        email: safeText(formData.guarantorEmail),
        phone: safeText(formData.guarantorPhone),
      },
      balance: 0, // 🔵 Ya no usamos balance manual
      status: editingTenant?.status ?? 'activo',
    };

    if (editingTenant) {
      setTenants(tenants.map((t) => (t.id === editingTenant.id ? newTenant : t)));
      if (oldPropertyId !== newTenant.propertyId) {
        updatePropertyTenant(newTenant.propertyId, newTenant.name, oldPropertyId);
      }
    } else {
      setTenants([...tenants, newTenant]);
      if (newTenant.propertyId) {
        updatePropertyTenant(newTenant.propertyId, newTenant.name);
      }
    }

    setShowModal(false);
    setEditingTenant(null);
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setFormData({
      name: safeText(tenant?.name),
      email: safeText(tenant?.email),
      phone: safeText(tenant?.phone),
      propertyId: tenant?.propertyId != null ? String(tenant.propertyId) : '',
      contractStart: safeText(tenant?.contractStart),
      contractEnd: safeText(tenant?.contractEnd),
      deposit: String(safeNumber(tenant?.deposit, 0)),
      guarantorName: safeText(tenant?.guarantor?.name),
      guarantorEmail: safeText(tenant?.guarantor?.email),
      guarantorPhone: safeText(tenant?.guarantor?.phone),
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('¿Está seguro de eliminar este inquilino?')) {
      const tenant = tenants.find((t) => t.id === id);
      if (tenant?.propertyId) {
        updatePropertyTenant(null, null, tenant.propertyId);
      }
      setTenants(tenants.filter((t) => t.id !== id));
    }
  };

  const getStatusColor = (status: Tenant['status']) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  /* =========================
     Render
     ========================= */

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inquilinos</h2>
          <p className="text-gray-600">Gestiona todos los inquilinos y sus contratos</p>
        </div>
        <button
          onClick={() => {
            setEditingTenant(null);
            setShowModal(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Agregar Inquilino</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquilino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Propiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contrato</th>
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
                  <tr key={tenant.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{tenant.name}</td>
                    <td className="px-6 py-4">{tenant.property || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      {tenant.contractStart} → {tenant.contractEnd}
                    </td>
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
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(tenant.status)}`}>
                        {prettyStatus(tenant.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => handleEdit(tenant)} className="text-blue-600 hover:text-blue-800">
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

    </div>
  );
};

export default TenantsManager;