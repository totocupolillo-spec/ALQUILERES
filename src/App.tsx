export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  propertyId: number | null;
  property: string;
  contractStart: string;
  contractEnd: string;

  updateFrequencyMonths: number;   // 🔥 NUEVO

  deposit: number;
  guarantor: {
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  status: 'activo' | 'vencido' | 'pendiente';
}