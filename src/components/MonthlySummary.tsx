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

const months = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  receipts,
  tenants,
  properties,
  onClose
}) => {

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const summaryData = useMemo(() => {
    if (!selectedMonth) return [];

    const monthReceipts = receipts.filter(
      r => r.month === selectedMonth && r.year === selectedYear
    );

    const rows: SummaryRow[] = properties.map(property => {

      const tenant = tenants.find(t => t.propertyId === property.id);

      // 🔵 OBLIGACIÓN DEL MES (automática)
      const contractActive =
        tenant &&
        new Date(tenant.contractStart) <= new Date(selectedYear, months.indexOf(selectedMonth), 1) &&
        new Date(tenant.contractEnd) >= new Date(selectedYear, months.indexOf(selectedMonth), 1);

      const monthlyObligation = contractActive ? Number(property.rent || 0) : 0;

      // 🔵 PAGOS DEL MES
      const paidAmount = monthReceipts
        .filter(r => r.property === property.name && r.building === property.building)
        .reduce((sum, r) => sum + Number(r.paidAmount || 0), 0);

      const totalDebt = Math.max(monthlyObligation - paidAmount, 0);

      return {
        building: property.building,
        address: property.address,
        tenant: tenant?.name || '-',
        property: property.name,
        paidAmount,
        totalDebt
      };
    });

    // Orden fijo por edificio
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

    const headers = ['Edificio','Propiedad','Dirección','Inquilino','Monto Pagado','Saldo Adeudado'];

    const csvContent = [
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
    link.download = `resumen_${selectedMonth}_${selectedYear}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Resumen Mensual
            </h3>
          </div>
          <button onClick={onClose}>
            <X className="h-6 w-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-3 py-2 rounded-lg"
          >
            <option value="">Seleccionar mes</option>
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <input
            type="number"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border px-3 py-2 rounded-lg"
          />

          <button
            onClick={exportToCSV}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Exportar CSV
          </button>

        </div>

        {selectedMonth && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-800">
                  ${totals.totalCollected.toLocaleString()}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">Total Adeudado</p>
                <p className="text-2xl font-bold text-red-800">
                  ${totals.totalDebt.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Edificio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Dirección
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Inquilino
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pagado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Adeudado
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {summaryData.map(row => (
                    <tr key={`${row.building}-${row.property}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{row.building} - {row.property}</td>
                      <td className="px-6 py-4">{row.address}</td>
                      <td className="px-6 py-4">{row.tenant}</td>
                      <td className="px-6 py-4 text-green-600 font-semibold">
                        ${row.paidAmount.toLocaleString()}
                      </td>
                      <td className={`px-6 py-4 font-semibold ${row.totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${row.totalDebt.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default MonthlySummary;