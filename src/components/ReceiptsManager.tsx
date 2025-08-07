import React, { useState, useEffect } from 'react';
import { Plus, FileText, Download, Eye, Search, Filter, X, Printer } from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';

interface ReceiptsManagerProps {
  tenants: Tenant[];
  properties: Property[];
  receipts: Receipt[];
  setReceipts: React.Dispatch<React.SetStateAction<Receipt[]>>;
  addCashMovement: (movement: Omit<CashMovement, 'id'>) => void;
  updateTenantBalance: (tenantName: string, newBalance: number) => void;
}

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({ 
  tenants, 
  properties,
  receipts, 
  setReceipts, 
  addCashMovement, 
  updateTenantBalance 
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);


  const [formData, setFormData] = useState({
    tenantId: '',
    tenant: '',
    property: '',
    building: '',
    month: '',
    year: new Date().getFullYear(),
    rent: '',
    expenses: '',
    otherCharges: [{ description: '', amount: '' }],
    dueDate: '',
    previousBalance: '',
    currency: 'ARS' as 'ARS' | 'USD',
    paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' | 'dolares'
  });

  const [paymentData, setPaymentData] = useState({
    paidAmount: '',
    paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' | 'dolares',
    currency: 'ARS' as 'ARS' | 'USD'
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState<Receipt | null>(null);

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Auto-fill tenant data when tenant is selected
  useEffect(() => {
    if (formData.tenantId) {
      const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId);
      const selectedProperty = selectedTenant?.propertyId ? 
        properties.find(p => p.id === selectedTenant.propertyId) : null;
      
      if (selectedTenant) {
        // Calcular fecha de vencimiento (10 días desde hoy)
        const today = new Date();
        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 10);
        
        setFormData(prev => ({
          ...prev,
          tenant: selectedTenant.name,
          property: selectedProperty?.name || selectedTenant.property,
          building: selectedProperty?.building || '',
          rent: selectedProperty?.rent.toString() || '0',
          expenses: selectedProperty?.expenses.toString() || '0',
          previousBalance: selectedTenant.balance.toString(),
          dueDate: dueDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.tenantId, tenants, properties]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const otherCharges = formData.otherCharges
      .filter(charge => charge.description && charge.amount)
      .map(charge => ({
        description: charge.description,
        amount: parseFloat(charge.amount)
      }));

    const rent = parseFloat(formData.rent);
    const expenses = parseFloat(formData.expenses);
    const previousBalance = parseFloat(formData.previousBalance) || 0;
    const otherTotal = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: `REC-${formData.year}-${String(receipts.length + 1).padStart(3, '0')}`,
      tenant: formData.tenant,
      property: formData.property,
      building: formData.building,
      month: formData.month,
      year: formData.year,
      rent,
      expenses,
      otherCharges,
      previousBalance,
      total: rent + expenses + otherTotal + previousBalance,
      paidAmount: 0,
      remainingBalance: rent + expenses + otherTotal + previousBalance,
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      status: 'pendiente',
      dueDate: formData.dueDate,
      createdDate: new Date().toISOString().split('T')[0]
    };

    // Show preview before saving
    setPreviewReceipt(newReceipt);
    setShowPreview(true);
  };

  const confirmReceipt = () => {
    if (previewReceipt) {
      // Show payment modal instead of directly saving
      setProcessingReceipt(previewReceipt);
      setPaymentData({
        paidAmount: previewReceipt.total.toString(),
        paymentMethod: previewReceipt.paymentMethod,
        currency: previewReceipt.currency
      });
      setShowPaymentModal(true);
      setShowPreview(false);
    }
  };

  const processPayment = () => {
    if (processingReceipt) {
      const paidAmount = parseFloat(paymentData.paidAmount) || 0;
      const remainingBalance = Math.max(0, processingReceipt.total - paidAmount);
      
      const finalReceipt: Receipt = {
        ...processingReceipt,
        paidAmount,
        remainingBalance,
        paymentMethod: paymentData.paymentMethod,
        currency: paymentData.currency,
        status: remainingBalance === 0 ? 'pagado' : 'pendiente'
      };

      setReceipts([...receipts, finalReceipt]);
      
      // Actualizar saldo del inquilino
      updateTenantBalance(processingReceipt.tenant, remainingBalance);
      
      // Agregar movimiento de caja si se pagó algo
      if (paidAmount > 0) {
        addCashMovement({
          type: 'income',
          description: `Pago alquiler - ${processingReceipt.tenant}`,
          amount: paidAmount,
          currency: paymentData.currency,
          date: new Date().toISOString().split('T')[0],
          tenant: processingReceipt.tenant,
          property: processingReceipt.property
        });
      }

      setFormData({
        tenantId: '',
        tenant: '',
        property: '',
        building: '',
        month: '',
        year: new Date().getFullYear(),
        rent: '',
        expenses: '',
        otherCharges: [{ description: '', amount: '' }],
        dueDate: '',
        previousBalance: '',
        currency: 'ARS',
        paymentMethod: 'efectivo'
      });
      
      setShowModal(false);
      setShowPaymentModal(false);
      setProcessingReceipt(null);
      setPreviewReceipt(null);
    }
  };

  const addOtherCharge = () => {
    setFormData({
      ...formData,
      otherCharges: [...formData.otherCharges, { description: '', amount: '' }]
    });
  };

  const removeOtherCharge = (index: number) => {
    const newCharges = formData.otherCharges.filter((_, i) => i !== index);
    setFormData({ ...formData, otherCharges: newCharges });
  };

  const updateOtherCharge = (index: number, field: 'description' | 'amount', value: string) => {
    const newCharges = [...formData.otherCharges];
    newCharges[index] = { ...newCharges[index], [field]: value };
    setFormData({ ...formData, otherCharges: newCharges });
  };

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'pagado': return 'bg-green-100 text-green-800';
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'vencido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            .total { font-weight: bold; font-size: 20px; margin-top: 20px; text-align: right; }
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
              ${receipt.otherCharges.map(charge => `
                <tr>
                  <td>${charge.description}</td>
                  <td style="text-align: right;">$${charge.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td><strong>TOTAL A PAGAR</strong></td>
                <td style="text-align: right;"><strong>$${receipt.total.toLocaleString()}</strong></td>
              </tr>
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

  const viewReceipt = (receipt: Receipt) => {
    setPreviewReceipt(receipt);
    setShowPreview(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>
          <p className="text-gray-600">Genera y gestiona los recibos de alquiler</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          <span>Generar Recibo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por inquilino o propiedad..."
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">Todos los estados</option>
              <option value="pagado">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recibo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inquilino
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Propiedad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{receipt.receiptNumber}</div>
                        <div className="text-sm text-gray-500">Creado: {receipt.createdDate}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receipt.tenant}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receipt.property}</div>
                    <div className="text-sm text-gray-500">{receipt.building}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receipt.month} {receipt.year}</div>
                    <div className="text-sm text-gray-500">Vence: {receipt.dueDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">${receipt.total.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(receipt.status)}`}>
                      {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewReceipt(receipt)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Ver recibo"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => printReceipt(receipt)}
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        title="Imprimir recibo"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generar Nuevo Recibo</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino</label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar inquilino</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id.toString()}>
                        {tenant.name} - {tenant.property}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad</label>
                  <input
                    type="text"
                    value={formData.property}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edificio</label>
                  <input
                    type="text"
                    value={formData.building}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar mes</option>
                    {months.map((month) => (
                      <option key={month} value={month}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler ($)</label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expensas ($)</label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo anterior ($)</label>
                  <input
                    type="number"
                    value={formData.previousBalance}
                    onChange={(e) => setFormData({ ...formData, previousBalance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'ARS' | 'USD' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ARS">Pesos Argentinos</option>
                    <option value="USD">Dólares</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="dolares">Dólares</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Otros cargos</label>
                  <button
                    type="button"
                    onClick={addOtherCharge}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Agregar cargo
                  </button>
                </div>
                {formData.otherCharges.map((charge, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={charge.description}
                      onChange={(e) => updateOtherCharge(index, 'description', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        placeholder="Monto"
                        value={charge.amount}
                        onChange={(e) => updateOtherCharge(index, 'amount', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      {formData.otherCharges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOtherCharge(index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Previsualizar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && processingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Registrar Pago</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total del recibo:</p>
                <p className="text-xl font-bold text-gray-900">
                  {processingReceipt.currency} ${processingReceipt.total.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto pagado</label>
                <input
                  type="number"
                  value={paymentData.paidAmount}
                  onChange={(e) => setPaymentData({ ...paymentData, paidAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de pago</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="dolares">Dólares</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                <select
                  value={paymentData.currency}
                  onChange={(e) => setPaymentData({ ...paymentData, currency: e.target.value as 'ARS' | 'USD' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ARS">Pesos Argentinos</option>
                  <option value="USD">Dólares</option>
                </select>
              </div>

              {parseFloat(paymentData.paidAmount) < processingReceipt.total && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Saldo pendiente: ${(processingReceipt.total - parseFloat(paymentData.paidAmount || '0')).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setProcessingReceipt(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={processPayment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showPreview && previewReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Previsualización del Recibo</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewReceipt(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Receipt Preview */}
            <div className="border border-gray-300 rounded-lg p-6 mb-4 bg-gray-50">
              <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
                <h1 className="text-2xl font-bold text-gray-900">RECIBO DE ALQUILER</h1>
                <h2 className="text-xl font-semibold text-gray-700">{previewReceipt.receiptNumber}</h2>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p><strong>Inquilino:</strong> {previewReceipt.tenant}</p>
                  <p><strong>Propiedad:</strong> {previewReceipt.property}</p>
                  <p className="text-gray-600"><strong>Edificio:</strong> {previewReceipt.building}</p>
                </div>
                <div>
                  <p><strong>Fecha de emisión:</strong> {previewReceipt.createdDate}</p>
                  <p><strong>Fecha de vencimiento:</strong> {previewReceipt.dueDate}</p>
                  <p><strong>Período:</strong> {previewReceipt.month} {previewReceipt.year}</p>
                </div>
              </div>

              <table className="w-full border-collapse border border-gray-300 mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Concepto</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Alquiler</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${previewReceipt.rent.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Expensas</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">${previewReceipt.expenses.toLocaleString()}</td>
                  </tr>
                  {previewReceipt.previousBalance > 0 && (
                    <tr>
                      <td className="border border-gray-300 px-4 py-2">Saldo anterior</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">${previewReceipt.previousBalance.toLocaleString()}</td>
                    </tr>
                  )}
                  {previewReceipt.otherCharges.map((charge, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{charge.description}</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">${charge.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="border border-gray-300 px-4 py-2">TOTAL A PAGAR</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {previewReceipt.currency} ${previewReceipt.total.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
                <p>Este recibo debe ser abonado antes del {previewReceipt.dueDate}</p>
                <p>Gracias por su puntualidad en el pago</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setPreviewReceipt(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => previewReceipt && printReceipt(previewReceipt)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir</span>
              </button>
              <button
                onClick={confirmReceipt}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsManager;