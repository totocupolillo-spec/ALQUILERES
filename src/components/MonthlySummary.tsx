import React, { useState, useMemo } from 'react';
import { X, Download, Calendar, Building2, DollarSign, AlertTriangle } from 'lucide-react';
import { Receipt, Tenant, Property } from '../App';

interface MonthlySummaryProps {
  receipts: Receipt[];
  tenants: Tenant[];
  properties: Property[];
  onClose: () => void;
}

interface SummaryRow {
  building: string;
  address: string;
  tenant: string;
  paidAmount: number;
  totalDebt: number;
  property: string;
}

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ receipts, tenants, properties, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const summaryData = useMemo(() => {
    if (!selectedMonth) return [];

    // Obtener recibos del mes y año seleccionado
    const monthReceipts = receipts.filter(receipt => 
      receipt.month === selectedMonth && receipt.year === selectedYear
    );

    // Crear un mapa de propiedades para acceso rápido
    const propertyMap = new Map(properties.map(p => [p.name, p]));
    
    // Crear un mapa de inquilinos para acceso rápido
    const tenantMap = new Map(tenants.map(t => [t.name, t]));

    // Crear resumen por inquilino
    const summaryMap = new Map<string, SummaryRow>();

    // Procesar recibos del mes
    monthReceipts.forEach(receipt => {
      const property = propertyMap.get(receipt.property);
      const tenant = tenantMap.get(receipt.tenant);
      
      if (property && tenant) {
        const key = `${receipt.tenant}-${receipt.property}`;
        
        if (summaryMap.has(key)) {
          const existing = summaryMap.get(key)!;
          existing.paidAmount += receipt.paidAmount;
        } else {
          summaryMap.set(key, {
            building: receipt.building,
            address: property.address,
            tenant: receipt.tenant,
            property: receipt.property,
            paidAmount: receipt.paidAmount,
            totalDebt: tenant.balance
          });
        }
      }
    });

    // Agregar inquilinos que no tienen recibos en el mes pero tienen deuda
    tenants.forEach(tenant => {
      if (tenant.balance > 0) {
        const property = properties.find(p => p.id === tenant.propertyId);
        if (property) {
          const key = `${tenant.name}-${property.name}`;
          
          if (!summaryMap.has(key)) {
            summaryMap.set(key, {
              building: property.building,
              address: property.address,
              tenant: tenant.name,
              property: property.name,
              paidAmount: 0,
              totalDebt: tenant.balance
            });
          }
        }
      }
    });

    return Array.from(summaryMap.values()).sort((a, b) => a.building.localeCompare(b.building));
  }, [selectedMonth, selectedYear, receipts, tenants, properties]);

  const totals = useMemo(() => {
    return summaryData.reduce(
      (acc, row) => ({
        totalCollected: acc.totalCollected + row.paidAmount,
        totalDebt: acc.totalDebt + row.totalDebt
      }),
      { totalCollected: 0, totalDebt: 0 }
    );
  }, [summaryData]);

  const exportToCSV = () => {
    if (!selectedMonth) return;

    const headers = ['Edificio', 'Dirección', 'Inquilino', 'Monto Pagado', 'Saldo Adeudado'];
    const csvContent = [
      `Resumen Mensual - ${selectedMonth} ${selectedYear}`,
      '',
      headers.join(','),
      ...summaryData.map(row => [
        row.building,
        row.address,
        row.tenant,
        row.paidAmount,
        row.totalDebt
      ].join(',')),
      '',
      `Total Cobranzas,,,${totals.totalCollected},`,
      `Total Adeudado,,,${totals.totalDebt},`
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `resumen_mensual_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  const printSummary = () => {
    if (!selectedMonth) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const summaryHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resumen Mensual - ${selectedMonth} ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary-table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .summary-table th, .summary-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .summary-table th { background-color: #f2f2f2; font-weight: bold; }
            .total-row { background-color: #f9f9f9; font-weight: bold; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RESUMEN MENSUAL DE COBRANZAS</h1>
            <h2>${selectedMonth} ${selectedYear}</h2>
          </div>
          
          <table class="summary-table">
            <thead>
              <tr>
                <th>Edificio</th>
                <th>Dirección</th>
                <th>Inquilino</th>
                <th>Monto Pagado</th>
                <th>Saldo Adeudado</th>
              </tr>
            </thead>
            <tbody>
              ${summaryData.map(row => `
                <tr>
                  <td>${row.building}</td>
                  <td>${row.address}</td>
                  <td>${row.tenant}</td>
                  <td>$${row.paidAmount.toLocaleString()}</td>
                  <td>$${row.totalDebt.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="3"><strong>TOTALES</strong></td>
                <td><strong>$${totals.totalCollected.toLocaleString()}</strong></td>
                <td><strong>$${totals.totalDebt.toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generado el ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(summaryHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Resumen Mensual de Cobranzas</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Seleccionar mes</option>
                {months.map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={exportToCSV}
                disabled={!selectedMonth || summaryData.length === 0}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                <Download className="h-4 w-4" />
                <span>Exportar</span>
              </button>
              <button
                onClick={printSummary}
                disabled={!selectedMonth || summaryData.length === 0}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                <Download className="h-4 w-4" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        {selectedMonth && summaryData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-600">Total Cobranzas</p>
                  <p className="text-2xl font-bold text-green-900">${totals.totalCollected.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-red-600">Total Adeudado</p>
                  <p className="text-2xl font-bold text-red-900">${totals.totalDebt.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Propiedades</p>
                  <p className="text-2xl font-bold text-blue-900">{summaryData.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Summary Table */}
        {selectedMonth ? (
          summaryData.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Edificio
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dirección
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Inquilino
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto Pagado
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo Adeudado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summaryData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">{row.building}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-600">{row.address}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">{row.tenant}</span>
                          <div className="text-xs text-gray-500">{row.property}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            row.paidAmount > 0 ? 'text-green-600' : 'text-gray-400'
                          }`}>
                            ${row.paidAmount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-semibold ${
                            row.totalDebt > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            ${row.totalDebt.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Totals Row */}
                    <tr className="bg-gray-100 font-bold">
                      <td colSpan={3} className="px-6 py-4 text-sm font-bold text-gray-900">
                        TOTALES
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">
                          ${totals.totalCollected.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-red-600">
                          ${totals.totalDebt.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos para este período</h3>
              <p className="text-gray-500">No se encontraron recibos para {selectedMonth} {selectedYear}</p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un mes y año</h3>
            <p className="text-gray-500">Elige el período para generar el resumen mensual</p>
          </div>
        )}

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MonthlySummary;