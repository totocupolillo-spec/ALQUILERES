import React, { useRef, useState } from 'react';
import { Download, Upload, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Property, Tenant, Receipt, CashMovement } from '../App';

interface DataManagerProps {
  properties: Property[];
  tenants: Tenant[];
  receipts: Receipt[];
  cashMovements: CashMovement[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
  setTenants: React.Dispatch<React.SetStateAction<Tenant[]>>;
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
  updateTenantBalance: (tenantName: string, newBalance: number) => void;
  updatePropertyTenant: (propertyId: number | null, tenantName: string | null, oldPropertyId?: number | null) => void;
  supabaseHook: any;
  user: any;
}

interface SystemData {
  version: string;
  exportDate: string;
  properties: Property[];
  tenants: Tenant[];
  receipts: Receipt[];
  cashMovements: CashMovement[];
  metadata: {
    totalProperties: number;
    totalTenants: number;
    totalReceipts: number;
    totalCashMovements: number;
    lastUpdated: string;
  };
}

const DataManager: React.FC<DataManagerProps> = ({
  properties,
  tenants,
  receipts,
  cashMovements,
  setProperties,
  setTenants,
  setReceipts,
  setCashMovements,
  updateTenantBalance,
  updatePropertyTenant,
  supabaseHook,
  user
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importData, setImportData] = useState<SystemData | null>(null);

  // Exportar todos los datos del sistema
  const exportAllData = () => {
    const systemData: SystemData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      properties,
      tenants,
      receipts,
      cashMovements,
      metadata: {
        totalProperties: properties.length,
        totalTenants: tenants.length,
        totalReceipts: receipts.length,
        totalCashMovements: cashMovements.length,
        lastUpdated: new Date().toISOString()
      }
    };

    const dataStr = JSON.stringify(systemData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `sistema_alquileres_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(link.href);
  };

  // Manejar selección de archivo para importar
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      setImportStatus('error');
      setImportMessage('Por favor selecciona un archivo JSON válido.');
      setShowImportModal(true);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SystemData;
        
        // Validar estructura del archivo
        if (!data.properties || !data.tenants || !data.receipts || !data.cashMovements) {
          throw new Error('Estructura de archivo inválida');
        }

        setImportData(data);
        setImportStatus('success');
        setImportMessage(`
          Archivo cargado correctamente:
          • ${data.metadata.totalProperties} propiedades
          • ${data.metadata.totalTenants} inquilinos  
          • ${data.metadata.totalReceipts} recibos
          • ${data.metadata.totalCashMovements} movimientos de caja
          • Exportado el: ${new Date(data.exportDate).toLocaleDateString()}
        `);
        setShowImportModal(true);
      } catch (error) {
        setImportStatus('error');
        setImportMessage('Error al leer el archivo. Asegúrate de que sea un backup válido del sistema.');
        setShowImportModal(true);
      }
    };

    reader.readAsText(file);
  };

  // Confirmar importación de datos
  const confirmImport = () => {
    if (!importData) return;

    setImportStatus('processing');
    setImportMessage('Importando datos...');

    try {
      // Importar propiedades
      setProperties(importData.properties);
      
      // Importar inquilinos
      setTenants(importData.tenants);
      
      // Importar recibos
      setReceipts(importData.receipts);
      
      // Importar movimientos de caja
      setCashMovements(importData.cashMovements);

      // Actualizar relaciones entre inquilinos y propiedades
      importData.tenants.forEach(tenant => {
        if (tenant.propertyId) {
          updatePropertyTenant(tenant.propertyId, tenant.name);
        }
      });

      // Si el usuario está autenticado, también guardar en Supabase
      if (user && supabaseHook) {
        syncDataToSupabase(importData);
      }
      setImportStatus('success');
      setImportMessage('¡Datos importados exitosamente! Todos tus datos han sido restaurados.');
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        setShowImportModal(false);
        setImportData(null);
        setImportStatus('idle');
      }, 2000);

    } catch (error) {
      setImportStatus('error');
      setImportMessage('Error al importar los datos. Por favor intenta nuevamente.');
    }
  };

  // Sincronizar datos importados con Supabase
  const syncDataToSupabase = async (data: SystemData) => {
    try {
      // Sincronizar propiedades
      for (const property of data.properties) {
        await supabaseHook.saveProperty(property);
      }
      
      // Sincronizar inquilinos
      for (const tenant of data.tenants) {
        await supabaseHook.saveTenant(tenant);
      }
      
      // Sincronizar recibos
      for (const receipt of data.receipts) {
        await supabaseHook.saveReceipt(receipt);
      }
      
      // Sincronizar movimientos de caja
      for (const movement of data.cashMovements) {
        await supabaseHook.saveCashMovement(movement);
      }
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
    }
  };

  const resetImport = () => {
    setShowImportModal(false);
    setImportData(null);
    setImportStatus('idle');
    setImportMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="flex items-center space-x-2">
        {/* Botón Exportar */}
        <button
          onClick={exportAllData}
          className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
          title="Exportar todos los datos del sistema"
        >
          <Download className="h-4 w-4" />
          <span>Exportar</span>
        </button>

        {/* Botón Importar */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          title="Importar datos desde backup"
        >
          <Upload className="h-4 w-4" />
          <span>Importar</span>
        </button>

        {/* Input oculto para seleccionar archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Modal de Importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {importStatus === 'processing' ? 'Procesando...' : 
                 importStatus === 'success' ? 'Importación Exitosa' : 
                 importStatus === 'error' ? 'Error de Importación' : 'Importar Datos'}
              </h3>
              {user && (
                <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  🔄 Sincronización automática activada
                </div>
              )}
              <button
                onClick={resetImport}
                className="text-gray-400 hover:text-gray-600"
                disabled={importStatus === 'processing'}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-start space-x-3">
                {importStatus === 'success' && <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />}
                {importStatus === 'error' && <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />}
                {importStatus === 'processing' && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 flex-shrink-0 mt-0.5"></div>
                )}
                
                <div className="flex-1">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                    {importMessage}
                  </pre>
                </div>
              </div>
            </div>

            {importStatus === 'success' && importData && !importMessage.includes('restaurados') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">¡ATENCIÓN!</p>
                    <p>Esta acción reemplazará TODOS los datos actuales del sistema. Esta operación no se puede deshacer.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              {importStatus === 'success' && importData && !importMessage.includes('restaurados') ? (
                <>
                  <button
                    onClick={resetImport}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImport}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirmar Importación
                  </button>
                </>
              ) : (
                <button
                  onClick={resetImport}
                  disabled={importStatus === 'processing'}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400"
                >
                  {importStatus === 'processing' ? 'Procesando...' : 'Cerrar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataManager;