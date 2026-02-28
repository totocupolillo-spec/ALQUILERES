import React, { useState, useEffect } from 'react';
import { Building2, Users, Receipt, Calendar, BarChart3, Wallet } from 'lucide-react';
import { useSupabase } from './hooks/useSupabase';
import { useFirebaseDB } from './hooks/useFirebaseDB';
import Dashboard from './components/Dashboard';
import PropertiesManager from './components/PropertiesManager';
import TenantsManager from './components/TenantsManager';
import ReceiptsManager from './components/ReceiptsManager';
import PaymentsHistory from './components/PaymentsHistory';
import CashRegister from './components/CashRegister';
import AuthComponent from './components/AuthComponent';
import { supabase } from './lib/supabase';
import { firebaseSmokeTest } from './lib/firebaseTest';

type TabType = 'dashboard' | 'properties' | 'tenants' | 'receipts' | 'history' | 'cash';

export const BUILDINGS = [
  'Ramos Mejia',
  'Limay',
  'Bolivar',
  'Alvear',
  'Faena',
  'Gaboto',
  'Gazcon',
  'Otro'
] as const;

export type BuildingType = typeof BUILDINGS[number];

export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  propertyId: number | null;
  property: string;
  contractStart: string;
  contractEnd: string;
  updateFrequencyMonths: number;
  deposit: number;
  guarantor: {
    name: string;
    email: string;
    phone: string;
  };
  balance: number;
  status: 'activo' | 'vencido' | 'pendiente';
}

export interface Property {
  id: number;
  name: string;
  type: 'departamento' | 'galpon' | 'local' | 'oficina' | 'otro';
  building: string;
  address: string;
  rent: number;
  expenses: number;
  updateFrequencyMonths: number; // 🔥 AHORA ESTÁ ACÁ TAMBIÉN
  tenant: string | null;
  status: 'ocupado' | 'disponible' | 'mantenimiento';
  contractStart: string;
  contractEnd: string;
  lastUpdated: string;
  notes: string;
}

export interface Receipt {
  id: number;
  receiptNumber: string;
  tenant: string;
  property: string;
  building: string;
  month: string;
  year: number;
  rent: number;
  expenses: number;
  otherCharges: { description: string; amount: number }[];
  previousBalance: number;
  total: number;
  paidAmount: number;
  remainingBalance: number;
  currency: 'ARS' | 'USD';
  paymentMethod: 'efectivo' | 'transferencia' | 'dolares';
  status: 'pagado' | 'pendiente' | 'vencido';
  dueDate: string;
  createdDate: string;
}

export interface CashMovement {
  id: number;
  type: 'income' | 'delivery';
  description: string;
  category?: 'owner' | 'maintenance' | 'commission' | 'other';
  amount: number;
  currency: 'ARS' | 'USD';
  date: string;
  tenant?: string;
  property?: string;
  comment?: string;
}

const saveToLocalStorage = (key: string, data: any) => {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
};

function App() {

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const supabaseHook = useSupabase();
  const firebaseDB = useFirebaseDB();
  const dbHook = firebaseDB;

  const [properties, setProperties] = useState<Property[]>(() =>
    loadFromLocalStorage('properties', [])
  );

  const [tenants, setTenants] = useState<Tenant[]>(() =>
    loadFromLocalStorage('tenants', [])
  );

  const [receipts, setReceipts] = useState<Receipt[]>(() =>
    loadFromLocalStorage('receipts', [])
  );

  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() =>
    loadFromLocalStorage('cashMovements', [])
  );

  useEffect(() => {
    firebaseSmokeTest();
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadAllDataFromFirebase();
  }, [user]);

  const loadAllDataFromFirebase = async () => {
    try {
      const [propertiesData, tenantsData, receiptsData, cashMovementsData] = await Promise.all([
        dbHook.loadProperties(),
        dbHook.loadTenants(),
        dbHook.loadReceipts(),
        dbHook.loadCashMovements()
      ]);

      if (propertiesData.length) setProperties(propertiesData);
      if (tenantsData.length) setTenants(tenantsData);
      if (receiptsData.length) setReceipts(receiptsData);
      if (cashMovementsData.length) setCashMovements(cashMovementsData);
    } catch {}
  };

  useEffect(() => saveToLocalStorage('properties', properties), [properties]);
  useEffect(() => saveToLocalStorage('tenants', tenants), [tenants]);
  useEffect(() => saveToLocalStorage('receipts', receipts), [receipts]);
  useEffect(() => saveToLocalStorage('cashMovements', cashMovements), [cashMovements]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'properties', label: 'Propiedades', icon: Building2 },
    { id: 'tenants', label: 'Inquilinos', icon: Users },
    { id: 'receipts', label: 'Recibos', icon: Receipt },
    { id: 'history', label: 'Historial', icon: Calendar },
    { id: 'cash', label: 'Arqueo', icon: Wallet },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tenants={tenants} receipts={receipts} properties={properties} setActiveTab={setActiveTab} />;
      case 'properties':
        return <PropertiesManager properties={properties} setProperties={setProperties} />;
      case 'tenants':
        return <TenantsManager tenants={tenants} setTenants={setTenants} properties={properties} receipts={receipts} updatePropertyTenant={() => {}} />;
      case 'receipts':
        return <ReceiptsManager tenants={tenants} properties={properties} receipts={receipts} setReceipts={setReceipts} addCashMovement={() => {}} updateTenantBalance={() => {}} supabaseHook={dbHook} user={user} />;
      case 'history':
        return <PaymentsHistory receipts={receipts} />;
      case 'cash':
        return <CashRegister cashMovements={cashMovements} setCashMovements={setCashMovements} supabaseHook={dbHook} user={user} />;
      default:
        return null;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Cargando sistema...</div>;
  if (!user) return <AuthComponent />;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-6 py-4 flex gap-6">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </nav>
      <main className="p-6">{renderContent()}</main>
    </div>
  );
}

export default App;