import React, { useState, useEffect } from 'react';
import { Building2, Users, Receipt, Calendar, BarChart3, Search, Bell, Wallet } from 'lucide-react';
import { useSupabase } from './hooks/useSupabase';
import { useFirebaseDB } from './hooks/useFirebaseDB';
import Dashboard from './components/Dashboard';
import PropertiesManager from './components/PropertiesManager';
import TenantsManager from './components/TenantsManager';
import ReceiptsManager from './components/ReceiptsManager';
import PaymentsHistory from './components/PaymentsHistory';
import CashRegister from './components/CashRegister';
import DataManager from './components/DataManager';
import AuthComponent from './components/AuthComponent';
import { supabase } from './lib/supabase';
import { firebaseSmokeTest } from './lib/firebaseTest';

type TabType = 'dashboard' | 'properties' | 'tenants' | 'receipts' | 'history' | 'cash';

// ✅ ORDEN FIJO DE EDIFICIOS
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

// Interfaces globales
export interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  propertyId: number | null;
  property: string;
  contractStart: string;
  contractEnd: string;
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

// LocalStorage
const saveToLocalStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (key: string, defaultValue: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // ✅ Supabase SOLO para Auth (por ahora)
  const supabaseHook = useSupabase();

  // ✅ Firebase para datos
  const firebaseDB = useFirebaseDB();

  // ✅ Hook de datos que usará TODA la app (mismo shape que supabaseHook)
  const dbHook = firebaseDB;

  // Estados con persistencia (fallback)
  const [properties, setProperties] = useState<Property[]>(() => loadFromLocalStorage('properties', []));
  const [tenants, setTenants] = useState<Tenant[]>(() => loadFromLocalStorage('tenants', []));
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadFromLocalStorage('receipts', []));
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(() => loadFromLocalStorage('cashMovements', []));

  // ✅ Test Firebase (solo al iniciar)
  useEffect(() => {
    firebaseSmokeTest();
  }, []);

  // ✅ Auth con Supabase (solo login)
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

  // ✅ Cargar datos desde Firebase cuando el usuario se autentica
  useEffect(() => {
    if (user) {
      loadAllDataFromFirebase();
    }
  }, [user]);

  const loadAllDataFromFirebase = async () => {
    try {
      const [propertiesData, tenantsData, receiptsData, cashMovementsData] = await Promise.all([
        dbHook.loadProperties(),
        dbHook.loadTenants(),
        dbHook.loadReceipts(),
        dbHook.loadCashMovements()
      ]);

      if (propertiesData.length > 0) setProperties(propertiesData);
      if (tenantsData.length > 0) setTenants(tenantsData);
      if (receiptsData.length > 0) setReceipts(receiptsData);
      if (cashMovementsData.length > 0) setCashMovements(cashMovementsData);
    } catch (error) {
      console.error('Error loading data from Firebase:', error);
    }
  };

  // Guardar en localStorage
  useEffect(() => {
    saveToLocalStorage('properties', properties);
  }, [properties]);

  useEffect(() => {
    saveToLocalStorage('tenants', tenants);
  }, [tenants]);

  useEffect(() => {
    saveToLocalStorage('receipts', receipts);
  }, [receipts]);

  useEffect(() => {
    saveToLocalStorage('cashMovements', cashMovements);
  }, [cashMovements]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'properties', label: 'Propiedades', icon: Building2 },
    { id: 'tenants', label: 'Inquilinos', icon: Users },
    { id: 'receipts', label: 'Recibos', icon: Receipt },
    { id: 'history', label: 'Historial', icon: Calendar },
    { id: 'cash', label: 'Arqueo', icon: Wallet },
  ] as const;

  // ✅ Agregar movimiento de caja (ahora Firebase)
  const addCashMovement = (movement: Omit<CashMovement, 'id'>) => {
    const newMovement: CashMovement = { ...movement, id: Date.now() };
    setCashMovements(prev => [newMovement, ...prev]);

    if (user) {
      dbHook.saveCashMovement(newMovement);
    }
  };

  // ✅ Actualizar saldo de inquilino (ahora Firebase)
  const updateTenantBalance = (tenantName: string, newBalance: number) => {
    setTenants(prev =>
      prev.map(tenant => (tenant.name === tenantName ? { ...tenant, balance: newBalance } : tenant))
    );

    if (user) {
      const tenant = tenants.find(t => t.name === tenantName);
      if (tenant) {
        dbHook.saveTenant({ ...tenant, balance: newBalance });
      }
    }
  };

  // ✅ Actualizar propiedad cuando se asigna/cambia inquilino (ahora Firebase)
  const updatePropertyTenant = (propertyId: number | null, tenantName: string | null, oldPropertyId?: number | null) => {
    setProperties(prev =>
      prev.map(property => {
        if (oldPropertyId && property.id === oldPropertyId) {
          const updatedProperty = { ...property, tenant: null, status: 'disponible' as const };
          if (user) dbHook.saveProperty(updatedProperty);
          return updatedProperty;
        }
        if (property.id === propertyId) {
          const updatedProperty = { ...property, tenant: tenantName, status: 'ocupado' as const };
          if (user) dbHook.saveProperty(updatedProperty);
          return updatedProperty;
        }
        return property;
      })
    );
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  // Auth
  if (!user) {
    return <AuthComponent />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard tenants={tenants} receipts={receipts} properties={properties} setActiveTab={setActiveTab} />;

      case 'properties':
        return <PropertiesManager properties={properties} setProperties={setProperties} />;

      case 'tenants':
        return (
          <TenantsManager
            tenants={tenants}
            setTenants={setTenants}
            properties={properties}
            updatePropertyTenant={updatePropertyTenant}
          />
        );

      case 'receipts':
        return (
          <ReceiptsManager
            tenants={tenants}
            properties={properties}
            receipts={receipts}
            setReceipts={setReceipts}
            addCashMovement={addCashMovement}
            updateTenantBalance={updateTenantBalance}
            supabaseHook={dbHook}
            user={user}
          />
        );

      case 'history':
        return <PaymentsHistory receipts={receipts} />;

      case 'cash':
        return (
          <CashRegister
            cashMovements={cashMovements}
            setCashMovements={setCashMovements}
            supabaseHook={dbHook}
            user={user}
          />
        );

      default:
        return <Dashboard tenants={tenants} receipts={receipts} properties={properties} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Sistema de Alquileres</h1>
              {dbHook.loading && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Sincronizando...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <DataManager
                properties={properties}
                tenants={tenants}
                receipts={receipts}
                cashMovements={cashMovements}
                setProperties={setProperties}
                setTenants={setTenants}
                setReceipts={setReceipts}
                setCashMovements={setCashMovements}
                updateTenantBalance={updateTenantBalance}
                updatePropertyTenant={updatePropertyTenant}
                supabaseHook={dbHook}
                user={user}
              />

              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>

              <button
                onClick={() => supabase.auth.signOut()}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {dbHook.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="text-red-600 text-sm">{dbHook.error}</div>
              <button onClick={() => dbHook.setError(null)} className="ml-auto text-red-600 hover:text-red-800">
                ×
              </button>
            </div>
          </div>
        )}
        {renderContent()}
      </main>
    </div>
  );
}

export default App;