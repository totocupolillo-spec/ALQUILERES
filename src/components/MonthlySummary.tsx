import React, { useState, useMemo } from 'react';
import { X, Download, BarChart3 } from 'lucide-react';
import { Receipt, Tenant, Property, BUILDINGS } from '../App';

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

const monthIndex: Record<string, number> = {
  Enero: 0,
  Febrero: 1,
  Marzo: 2,
  Abril: 3,
  Mayo: 4,
  Junio: 5,
  Julio: 6,
  Agosto: 7,
  Septiembre: 8,
  Octubre: 9,
  Noviembre: 10,
  Diciembre: 11
};

const MonthlySummary: React.FC<MonthlySummaryProps> = ({ receipts, tenants, properties, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    receipts.forEach(r => years.add(r.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [receipts]);

  const summaryData = useMemo(() => {
    if (!selectedMonth) return [] as SummaryRow[];

    const monthReceipts = receipts.filter(r => r.month === selectedMonth && r.year === selectedYear);

    const tenantByName = new Map(tenants.map(t => [t.name, t]));
    const tenantByPropertyId = new Map(tenants.filter(t => t.propertyId != null).map(t => [t.propertyId as number, t]));

    const receiptsByPropertyName = new Map<string, Receipt[]>();
    monthReceipts.forEach(r => {
      const key = `${r.building}||${r.property}`;
      const arr = receiptsByPropertyName.get(key) ?? [];
      arr.push(r);
      receiptsByPropertyName.set(key, arr);
    });

    const rows: SummaryRow[] = properties.map((p) => {
      const t = p.tenant ? tenantByName.get(p.tenant) : (p.id ? tenantByPropertyId.get(p.id) : undefined);
      const tenantName = t?.name || p.tenant || '';
      const key = `${p.building}||${p.name}`;
      const propReceipts = receiptsByPropertyName.get(key) ?? [];
      const paidAmount = propReceipts.reduce((sum, r) => sum + (r.paidAmount || 0), 0);

      // Deuda: priorizamos el balance del inquilino (es el dato que usa el sistema)
      // Si no existe balance, usamos saldo pendiente del/los recibos del mes.
      const tenantDebt = typeof t?.balance === 'number' ? t.balance : 0;
      const receiptsDebt = propReceipts.reduce((sum, r) => sum + (r.remainingBalance || 0), 0);
      const totalDebt = Math.max(tenantDebt, receiptsDebt);

      return {
        building: p.building,
        address: p.address,
        tenant: tenantName || '-',
        property: p.name,
        paidAmount,
        totalDebt
      };
    });

    const buildingOrderIndex = (b: string) => {
      const idx = BUILDINGS.findIndex(x => x === b);
      return idx === -1 ? 999 : idx;
    };

    return rows.sort((a, b) => {
      const bo = buildingOrderIndex(a.building) - buildingOrderIndex(b.building);
      if (bo !== 0) return bo;
      return a.property.localeCompare(b.property);
    });
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

    const headers = ['Edificio', 'Propiedad', 'Dirección', 'Inquilino', 'Monto Pagado', 'Saldo Adeudado'];
    const csvContent = [
      `Resumen Mensual - ${selectedMonth} ${selectedYear}`,
      '',
      headers.join(','),
      ...summaryData.map(row => [
        row.building,
        row.property,
        row.address,
        row.tenant,
        row.paidAmount,
        row.totalDebt
      ].join(',')),
      '',
      `Total Cobranzas,,,,${totals.totalCollected},`,
      `Total Adeudado,,,,${totals.totalDebt},`
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
                <th>Propiedad</th>
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
                  <td>${row.property}</td>
                  <td>${row.address}</td>
                  <td>${row.tenant}</td>
                  <td>$${row.paidAmount.toLocaleString()}</td>
                  <td>$${row.totalDebt.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="4"><strong>TOTALES</strong></td>
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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
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

        {/* Summary Cards */}
        {selectedMonth && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Cobranzas</p>
                  <p className="text-2xl font-bold text-green-900">${totals.totalCollected.toLocaleString()}</p>
                </div>
                <div className="text-green-600 text-3xl">$</div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Adeudado</p>
                  <p className="text-2xl font-bold text-red-900">${totals.totalDebt.toLocaleString()}</p>
                </div>
                <div className="text-red-600 text-3xl">⚠</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Propiedades</p>
                  <p className="text-2xl font-bold text-blue-900">{summaryData.length}</p>
                </div>
                <div className="text-blue-600 text-3xl">🏢</div>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        {selectedMonth ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EDIFICIO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DIRECCIÓN</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">INQUILINO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MONTO PAGADO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SALDO ADEUDADO</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summaryData.map((row) => (
                    <tr key={`${row.building}-${row.property}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{row.building}</div>
                        <div className="text-xs text-gray-500">{row.property}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.address}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{row.tenant}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">${row.paidAmount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-semibold ${row.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${row.totalDebt.toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Selecciona un mes para ver el resumen.
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlySummary;
