import React, { useMemo, useState } from 'react';
import { Calendar, Filter, Download, Search, Printer, X, Eye } from 'lucide-react';
import { Receipt } from '../App';

interface PaymentsHistoryProps {
  receipts: Receipt[];
}

const PaymentsHistory: React.FC<PaymentsHistoryProps> = ({ receipts }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  // Convertir receipts a formato de payments para compatibilidad
  const payments = useMemo(() => {
    return receipts.map(receipt => ({
      id: receipt.id,
      receiptNumber: receipt.receiptNumber,
      tenant: receipt.tenant,
      property: receipt.property,
      building: receipt.building,
      amount: receipt.paidAmount,
      paymentDate: receipt.createdDate,
      month: receipt.month,
      year: receipt.year,
      paymentMethod: receipt.paymentMethod,
      status: receipt.status === 'pagado' ? 'confirmado' as const : 'pendiente_confirmacion' as const,
      receipt
    }));
  }, [receipts]);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    payments.forEach(p => years.add(p.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [payments]);

  // Get unique values for filters
  const uniqueTenants = useMemo(() => [...new Set(payments.map(p => p.tenant))].sort(), [payments]);
  const uniqueProperties = useMemo(() => [...new Set(payments.map(p => p.property))].sort(), [payments]);
  const uniqueBuildings = useMemo(() => [...new Set(payments.map(p => p.building))].sort(), [payments]);

  const filteredPayments = payments.filter(payment => {
    const yearMatch = payment.year === selectedYear;
    const monthMatch = !selectedMonth || payment.month === selectedMonth;
    const statusMatch = !selectedStatus || payment.status === selectedStatus;
    const tenantMatch = !selectedTenant || payment.tenant === selectedTenant;
    const propertyMatch = selectedProperties.length === 0 || selectedProperties.includes(payment.property);
    const buildingMatch = !selectedBuilding || payment.building === selectedBuilding;
    const searchMatch = !searchTerm ||
      payment.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());

    return yearMatch && monthMatch && statusMatch && tenantMatch && propertyMatch && buildingMatch && searchMatch;
  });

  const totalAmount = filteredPayments.reduce((sum, payment) => sum + payment.amount, 0);

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedStatus('');
    setSelectedTenant('');
    setSelectedProperties([]);
    setSelectedBuilding('');
    setSearchTerm('');
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      efectivo: 'Efectivo',
      transferencia: 'Transferencia',
      dolares: 'Dólares'
    };
    return labels[method as keyof typeof labels] || method;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendiente_confirmacion': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const viewReceipt = (payment: any) => {
    if (payment.receipt) {
      setSelectedReceipt(payment.receipt);
      setShowReceiptModal(true);
    }
  };

  const printReceipt = (receipt: Receipt) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Recibo ${receipt.receiptNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .receipt-info { margin-bottom: 20px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .charges { border-collapse: collapse; width: 100%; margin: 20px 0; }
            .charges th, .charges td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            .charges th { background-color: #f2f2f2; font-weight: bold; }
            .total-row { background-color: #f9f9f9; font-weight: bold; }
            .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center; }
            .building { color: #666; font-style: italic; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>RECIBO DE ALQUILER</h1>
            <h2>${receipt.receiptNumber}</h2>
          </div>

          <div class="receipt-info">
            <div class="info-row">
              <span><strong>Inquilino:</strong> ${receipt.tenant}</span>
              <span><strong>Fecha de emisión:</strong> ${receipt.createdDate}</span>
            </div>
            <div class="info-row">
              <span><strong>Propiedad:</strong> ${receipt.property}</span>
              <span><strong>Fecha de vencimiento:</strong> ${receipt.dueDate}</span>
            </div>
            <div class="info-row">
              <span class="building"><strong>Edificio:</strong> ${receipt.building}</span>
              <span><strong>Período:</strong> ${receipt.month} ${receipt.year}</span>
            </div>
          </div>

          <table class="charges">
            <thead>
              <tr>
                <th>Concepto</th>
                <th style="text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Alquiler</td>
                <td style="text-align: right;">$${receipt.rent.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Expensas</td>
                <td style="text-align: right;">$${receipt.expenses.toLocaleString()}</td>
              </tr>
              ${receipt.previousBalance > 0 ? `
                <tr>
                  <td>Saldo anterior</td>
                  <td style="text-align: right;">$${receipt.previousBalance.toLocaleString()}</td>
                </tr>
              ` : ''}
              ${receipt.otherCharges.map(charge => `
                <tr>
                  <td>${charge.description}</td>
                  <td style="text-align: right;">$${charge.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>TOTAL A PAGAR</strong></td>
                <td style="text-align: right;"><strong>${receipt.currency} $${receipt.total.toLocaleString()}</strong></td>
              </tr>
              ${receipt.paidAmount > 0 ? `
                <tr>
                  <td><strong>PAGADO</strong></td>
                  <td style="text-align: right;"><strong>$${receipt.paidAmount.toLocaleString()}</strong></td>
                </tr>
              ` : ''}
              ${receipt.remainingBalance > 0 ? `
                <tr style="background-color: #fee2e2;">
                  <td><strong>SALDO PENDIENTE</strong></td>
                  <td style="text-align: right;"><strong>$${receipt.remainingBalance.toLocaleString()}</strong></td>
                </tr>
              ` : ''}
            </tbody>
          </table>

          <div class="footer">
            <p>Este recibo debe ser abonado antes del ${receipt.dueDate}</p>
            <p>Gracias por su puntualidad en el pago</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = () => {
    const headers = ['Fecha', 'Recibo', 'Inquilino', 'Propiedad', 'Edificio', 'Monto', 'Método', 'Estado'];
    const csvContent = [
      headers.join(','),
      ...filteredPayments.map(payment => [
        payment.paymentDate,
        payment.receiptNumber,
        payment.tenant,
        payment.property,
        payment.building,
        payment.amount,
        getPaymentMethodLabel(payment.paymentMethod),
        payment.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historial_pagos_${selectedYear}.csv`;
    link.click();
  };

  const toggleProperty = (prop: string) => {
    setSelectedProperties(prev => prev.includes(prop) ? prev.filter(p => p !== prop) : [...prev, prop]);
  };

  const propertyLabel = selectedProperties.length === 0
    ? 'Todas'
    : selectedProperties.length === 1
      ? selectedProperties[0]
      : `${selectedProperties.length} seleccionadas`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Pagos</h2>
          <p className="text-gray-600">Consulta y analiza todos los pagos recibidos</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="h-5 w-5" />
          <span>Exportar CSV</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros Personalizados</h3>
          </div>
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 transition-colors">
            Limpiar filtros
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por inquilino, propiedad, edificio o número de recibo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los meses</option>
              {months.map((month) => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino</label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los inquilinos</option>
              {uniqueTenants.map((tenant) => (
                <option key={tenant} value={tenant}>{tenant}</option>
              ))}
            </select>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Propiedades</label>
            <button
              type="button"
              onClick={() => setShowPropertyPicker(v => !v)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white hover:bg-gray-50"
            >
              {propertyLabel}
            </button>

            {showPropertyPicker && (
              <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-gray-100">
                  <button
                    type="button"
                    onClick={() => setSelectedProperties([])}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Limpiar selección
                  </button>
                </div>
                <div className="p-2">
                  {uniqueProperties.map((prop) => (
                    <label key={prop} className="flex items-center space-x-2 py-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedProperties.includes(prop)}
                        onChange={() => toggleProperty(prop)}
                      />
                      <span className="text-sm text-gray-700">{prop}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los edificios</option>
              {uniqueBuildings.map((building) => (
                <option key={building} value={building}>{building}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos</option>
              <option value="confirmado">Confirmado</option>
              <option value="pendiente_confirmacion">Pendiente</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Mostrando <strong>{filteredPayments.length}</strong> pagos · Total: <strong>${totalAmount.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recibo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inquilino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propiedad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edificio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paymentDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{payment.receiptNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.tenant}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.property}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.building}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">${payment.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getPaymentMethodLabel(payment.paymentMethod)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button onClick={() => viewReceipt(payment)} className="text-gray-400 hover:text-blue-600 transition-colors" title="Ver recibo">
                        <Eye className="h-4 w-4" />
                      </button>
                      {payment.receipt && (
                        <button onClick={() => printReceipt(payment.receipt)} className="text-gray-400 hover:text-green-600 transition-colors" title="Imprimir">
                          <Printer className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                    No hay pagos para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Recibo {selectedReceipt.receiptNumber}</h3>
              <button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Inquilino:</strong> {selectedReceipt.tenant}</p>
                  <p><strong>Propiedad:</strong> {selectedReceipt.property}</p>
                  <p><strong>Edificio:</strong> {selectedReceipt.building}</p>
                </div>
                <div>
                  <p><strong>Período:</strong> {selectedReceipt.month} {selectedReceipt.year}</p>
                  <p><strong>Emisión:</strong> {selectedReceipt.createdDate}</p>
                  <p><strong>Vencimiento:</strong> {selectedReceipt.dueDate}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-gray-200 pt-4">
                <table className="w-full text-sm">
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2">Alquiler</td>
                      <td className="py-2 text-right">${selectedReceipt.rent.toLocaleString()}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2">Expensas</td>
                      <td className="py-2 text-right">${selectedReceipt.expenses.toLocaleString()}</td>
                    </tr>
                    {selectedReceipt.previousBalance > 0 && (
                      <tr className="border-b">
                        <td className="py-2">Saldo anterior</td>
                        <td className="py-2 text-right">${selectedReceipt.previousBalance.toLocaleString()}</td>
                      </tr>
                    )}
                    {selectedReceipt.otherCharges.map((c, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2">{c.description}</td>
                        <td className="py-2 text-right">${c.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td className="py-2">TOTAL</td>
                      <td className="py-2 text-right">{selectedReceipt.currency} ${selectedReceipt.total.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2">PAGADO</td>
                      <td className="py-2 text-right">${selectedReceipt.paidAmount.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-2">SALDO</td>
                      <td className={`py-2 text-right font-semibold ${selectedReceipt.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${selectedReceipt.remainingBalance.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsHistory;
