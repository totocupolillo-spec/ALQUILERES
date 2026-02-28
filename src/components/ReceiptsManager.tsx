import React, { useState, useEffect } from 'react';
import {
  Plus,
  FileText,
  Eye,
  X,
  Printer,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { Tenant, Receipt, CashMovement, Property } from '../App';
import MonthlySummary from './MonthlySummary';

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
  updateTenantBalance,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<Receipt | null>(null);

  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateAlertMessage, setUpdateAlertMessage] = useState('');
  const [pendingReceipt, setPendingReceipt] = useState<Receipt | null>(null);

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
    paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' | 'dolares',
  });

  const [paymentData, setPaymentData] = useState({
    paidAmount: '',
    paymentMethod: 'efectivo' as 'efectivo' | 'transferencia' | 'dolares',
    currency: 'ARS' as 'ARS' | 'USD',
  });

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [processingReceipt, setProcessingReceipt] = useState<Receipt | null>(null);

  const [showMonthlySummary, setShowMonthlySummary] = useState(false);

  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const addMonths = (date: Date, monthsToAdd: number) => {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + monthsToAdd);
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  };

  const getMonthIndex = (monthName: string) => {
    return months.findIndex((m) => m.toLowerCase() === monthName.toLowerCase());
  };

  const isUpdateDueForTenantAndPeriod = (tenant: Tenant, monthName: string, year: number) => {
    if (!tenant.updateFrequencyMonths || tenant.updateFrequencyMonths <= 0)
      return { due: false, nextUpdateDate: null as Date | null };
    if (!tenant.contractStart) return { due: false, nextUpdateDate: null as Date | null };

    const baseDateStr = (tenant as any).lastUpdateApplied || tenant.contractStart;
    const base = new Date(baseDateStr);
    if (Number.isNaN(base.getTime())) return { due: false, nextUpdateDate: null as Date | null };

    const next = addMonths(base, tenant.updateFrequencyMonths);

    const monthIdx = getMonthIndex(monthName);
    if (monthIdx < 0) return { due: false, nextUpdateDate: next };

    const periodStart = new Date(year, monthIdx, 1);
    const periodEnd = new Date(year, monthIdx + 1, 0, 23, 59, 59, 999);

    const due = next >= periodStart && next <= periodEnd;
    return { due, nextUpdateDate: next };
  };

  // --- FIX CLAVE: evitar números duplicados / lista en blanco por "stale state" ---
  const getNextReceiptNumber = (year: number) => {
    // Busca el mayor correlativo para el año y suma 1
    let maxN = 0;
    receipts.forEach((r) => {
      if (r.year !== year) return;
      const match = String(r.receiptNumber || '').match(/REC-\d{4}-(\d{3,})/);
      if (!match) return;
      const n = parseInt(match[1], 10);
      if (!Number.isNaN(n)) maxN = Math.max(maxN, n);
    });
    const next = maxN + 1;
    return `REC-${year}-${String(next).padStart(3, '0')}`;
  };

  // Auto-fill tenant data when tenant is selected
  useEffect(() => {
    if (!formData.tenantId) return;

    const selectedTenant = tenants.find((t) => t.id.toString() === formData.tenantId);
    const selectedProperty = selectedTenant?.propertyId
      ? properties.find((p) => p.id === selectedTenant.propertyId)
      : null;

    if (!selectedTenant) return;

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 10);

    setFormData((prev) => ({
      ...prev,
      tenant: selectedTenant.name,
      property: selectedProperty?.name || selectedTenant.property,
      building: selectedProperty?.building || '',
      rent: selectedProperty?.rent?.toString?.() || '0',
      expenses: selectedProperty?.expenses?.toString?.() || '0',
      previousBalance: (selectedTenant as any).balance?.toString?.() || '0',
      dueDate: dueDate.toISOString().split('T')[0],
    }));
  }, [formData.tenantId, tenants, properties]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const otherCharges = formData.otherCharges
      .filter((charge) => charge.description && charge.amount)
      .map((charge) => ({
        description: charge.description,
        amount: parseFloat(charge.amount),
      }));

    const rent = parseFloat(formData.rent) || 0;
    const expenses = parseFloat(formData.expenses) || 0;
    const previousBalance = parseFloat(formData.previousBalance) || 0;
    const otherTotal = otherCharges.reduce((sum, charge) => sum + (charge.amount || 0), 0);

    const total = rent + expenses + otherTotal + previousBalance;

    const newReceipt: Receipt = {
      id: Date.now(),
      receiptNumber: getNextReceiptNumber(formData.year),
      tenant: formData.tenant,
      property: formData.property,
      building: formData.building,
      month: formData.month,
      year: formData.year,
      rent,
      expenses,
      otherCharges,
      previousBalance,
      total,
      paidAmount: 0,
      remainingBalance: total,
      currency: formData.currency,
      paymentMethod: formData.paymentMethod,
      status: 'pendiente',
      dueDate: formData.dueDate,
      createdDate: new Date().toISOString().split('T')[0],
    };

    // Aviso de actualización de contrato (manual)
    const selectedTenant = tenants.find((t) => t.id.toString() === formData.tenantId);
    if (selectedTenant && formData.month) {
      const { due, nextUpdateDate } = isUpdateDueForTenantAndPeriod(
        selectedTenant,
        formData.month,
        formData.year
      );
      if (due && nextUpdateDate) {
        setPendingReceipt(newReceipt);
        setUpdateAlertMessage(
          `Este mes corresponde actualización de contrato para ${selectedTenant.name}. ` +
            `Fecha estimada: ${nextUpdateDate.toISOString().split('T')[0]}. ` +
            `Corroborá el porcentaje/monto antes de generar el recibo.`
        );
        setShowUpdateAlert(true);
        return;
      }
    }

    setPreviewReceipt(newReceipt);
    setShowPreview(true);
  };

  const confirmUpdateAlert = () => {
    if (pendingReceipt) {
      setPreviewReceipt(pendingReceipt);
      setShowPreview(true);
      setPendingReceipt(null);
    }
    setShowUpdateAlert(false);
    setUpdateAlertMessage('');
  };

  const cancelUpdateAlert = () => {
    setShowUpdateAlert(false);
    setUpdateAlertMessage('');
    setPendingReceipt(null);
  };

  // --- FIX CLAVE: al confirmar, SE GUARDA YA el recibo (pendiente) y se abre impresión + modal de pago ---
  const confirmReceipt = () => {
    if (!previewReceipt) return;

    // 1) Guardar recibo pendiente inmediatamente (para que aparezca en la lista SIEMPRE)
    setReceipts((prev) => [...prev, previewReceipt]);

    // 2) Cerrar modales de creación / preview
    setShowPreview(false);
    setShowModal(false);

    // 3) Abrir impresión / vista para imprimir
    printReceipt(previewReceipt);

    // 4) Abrir modal de pago con monto sugestivo (editable)
    setProcessingReceipt(previewReceipt);
    setPaymentData({
      paidAmount: String(previewReceipt.total), // sugestivo pero editable
      paymentMethod: previewReceipt.paymentMethod,
      currency: previewReceipt.currency,
    });
    setShowPaymentModal(true);
  };

  // --- FIX CLAVE: el pago ACTUALIZA el recibo existente (no agrega uno nuevo) ---
  const processPayment = () => {
    if (!processingReceipt) return;

    const paidAmount = parseFloat(paymentData.paidAmount) || 0;
    const remainingBalance = Math.max(0, processingReceipt.total - paidAmount);

    const updatedReceipt: Receipt = {
      ...processingReceipt,
      paidAmount,
      remainingBalance,
      paymentMethod: paymentData.paymentMethod,
      currency: paymentData.currency,
      status: remainingBalance === 0 ? 'pagado' : 'pendiente',
    };

    // Actualizar recibo ya guardado en la lista
    setReceipts((prev) => prev.map((r) => (r.id === processingReceipt.id ? updatedReceipt : r)));

    // Actualizar saldo del inquilino
    updateTenantBalance(processingReceipt.tenant, remainingBalance);

    // Movimiento de caja si se pagó algo
    if (paidAmount > 0) {
      addCashMovement({
        type: 'income',
        description: `Pago alquiler - ${processingReceipt.tenant}`,
        amount: paidAmount,
        currency: paymentData.currency,
        date: new Date().toISOString().split('T')[0],
        tenant: processingReceipt.tenant,
        property: processingReceipt.property,
      });
    }

    // Reset formulario
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
      paymentMethod: 'efectivo',
    });

    setShowPaymentModal(false);
    setProcessingReceipt(null);
    setPreviewReceipt(null);
  };

  const addOtherCharge = () => {
    setFormData((prev) => ({
      ...prev,
      otherCharges: [...prev.otherCharges, { description: '', amount: '' }],
    }));
  };

  const removeOtherCharge = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      otherCharges: prev.otherCharges.filter((_, i) => i !== index),
    }));
  };

  const updateOtherCharge = (index: number, field: 'description' | 'amount', value: string) => {
    setFormData((prev) => {
      const newCharges = [...prev.otherCharges];
      newCharges[index] = { ...newCharges[index], [field]: value };
      return { ...prev, otherCharges: newCharges };
    });
  };

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-800';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'vencido':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; gap: 12px; flex-wrap: wrap; }
            .charges { margin-top: 20px; }
            .charge-row { display: flex; justify-content: space-between; margin-bottom: 5px; gap: 12px; }
            .total { font-size: 18px; font-weight: bold; border-top: 2px solid #333; padding-top: 10px; margin-top: 20px; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            .signature { margin-top: 50px; display: flex; justify-content: space-between; gap: 18px; }
            .signature-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; }
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
              <span><strong>Fecha:</strong> ${new Date(receipt.createdDate).toLocaleDateString()}</span>
            </div>
            <div class="info-row">
              <span><strong>Propiedad:</strong> ${receipt.property}</span>
              <span><strong>Edificio:</strong> ${receipt.building}</span>
            </div>
            <div class="info-row">
              <span><strong>Período:</strong> ${receipt.month} ${receipt.year}</span>
              <span><strong>Vencimiento:</strong> ${new Date(receipt.dueDate).toLocaleDateString()}</span>
            </div>
          </div>

          <div class="charges">
            <h3>Detalle de Cargos</h3>
            <div class="charge-row">
              <span>Alquiler:</span>
              <span>${receipt.currency} ${Number(receipt.rent || 0).toLocaleString()}</span>
            </div>
            <div class="charge-row">
              <span>Expensas:</span>
              <span>${receipt.currency} ${Number(receipt.expenses || 0).toLocaleString()}</span>
            </div>

            ${(receipt.otherCharges || []).map(
              (charge) => `
              <div class="charge-row">
                <span>${charge.description}:</span>
                <span>${receipt.currency} ${Number(charge.amount || 0).toLocaleString()}</span>
              </div>
            `
            ).join('')}

            ${Number(receipt.previousBalance || 0) > 0 ? `
              <div class="charge-row">
                <span>Saldo Anterior:</span>
                <span>${receipt.currency} ${Number(receipt.previousBalance || 0).toLocaleString()}</span>
              </div>
            ` : ''}
          </div>

          <div class="total">
            <div class="info-row">
              <span>TOTAL:</span>
              <span>${receipt.currency} ${Number(receipt.total || 0).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span>PAGADO:</span>
              <span>${receipt.currency} ${Number(receipt.paidAmount || 0).toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span>SALDO:</span>
              <span>${receipt.currency} ${Number(receipt.remainingBalance || 0).toLocaleString()}</span>
            </div>
          </div>

          <div class="signature">
            <div class="signature-line">Firma Inquilino</div>
            <div class="signature-line">Firma Propietario</div>
          </div>

          <div class="footer">
            <p>Recibo generado por Sistema de Alquileres</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recibos</h2>
          <p className="text-gray-600">Genera y gestiona recibos de alquiler</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowMonthlySummary(true)}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <BarChart3 className="h-5 w-5" />
            <span>Resumen Mensual</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Nuevo Recibo</span>
          </button>
        </div>
      </div>

      {/* Receipts List */}
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{receipt.receiptNumber}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(receipt.createdDate).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.tenant}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{receipt.property}</div>
                    <div className="text-sm text-gray-500">{receipt.building}</div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {receipt.month} {receipt.year}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {receipt.currency} {Number(receipt.total || 0).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        receipt.status
                      )}`}
                    >
                      {receipt.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => printReceipt(receipt)}
                        className="text-gray-600 hover:text-gray-900"
                        title="Imprimir"
                      >
                        <Printer className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => printReceipt(receipt)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver / Imprimir"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {receipts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No hay recibos generados
                    </h3>
                    <p className="text-gray-500">Comienza generando tu primer recibo</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary Modal */}
      {showMonthlySummary && (
        <MonthlySummary
          receipts={receipts}
          tenants={tenants}
          properties={properties}
          onClose={() => setShowMonthlySummary(false)}
        />
      )}

      {/* Update alert */}
      {showUpdateAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <h3 className="text-xl font-semibold text-gray-900">Actualización de contrato</h3>
              </div>
              <button onClick={cancelUpdateAlert} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-900">{updateAlertMessage}</p>
              <p className="text-xs text-yellow-800 mt-2">
                No se modificará el monto automáticamente (control manual).
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelUpdateAlert}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpdateAlert}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Entendido, generar recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview */}
      {showPreview && previewReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Vista Previa del Recibo</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Inquilino</p>
                  <p className="font-medium">{previewReceipt.tenant}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Propiedad</p>
                  <p className="font-medium">{previewReceipt.property}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Período</p>
                  <p className="font-medium">
                    {previewReceipt.month} {previewReceipt.year}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-medium">
                    {previewReceipt.currency} {Number(previewReceipt.total || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Volver
              </button>
              <button
                onClick={confirmReceipt}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirmar (guardar + imprimir)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && processingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Registrar Pago</h3>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setProcessingReceipt(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Recibo</span>
                  <span className="font-medium">{processingReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">
                    {processingReceipt.currency} {Number(processingReceipt.total || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto Pagado</label>
                <input
                  type="number"
                  value={paymentData.paidAmount}
                  onChange={(e) => setPaymentData({ ...paymentData, paidAmount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugerido: total del recibo (podés editarlo).
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="dolares">Dólares</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setProcessingReceipt(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Ahora no
                </button>
                <button
                  onClick={processPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Registrar Pago
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Nuevo Recibo</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Inquilino</label>
                  <select
                    value={formData.tenantId}
                    onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar inquilino</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
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
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alquiler</label>
                  <input
                    type="number"
                    value={formData.rent}
                    onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expensas</label>
                  <input
                    type="number"
                    value={formData.expenses}
                    onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Anterior</label>
                  <input
                    type="number"
                    value={formData.previousBalance}
                    onChange={(e) => setFormData({ ...formData, previousBalance: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Other charges */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-3">Otros Cargos</h4>
                <div className="space-y-3">
                  {formData.otherCharges.map((charge, index) => (
                    <div key={index} className="flex space-x-3">
                      <input
                        type="text"
                        value={charge.description}
                        onChange={(e) => updateOtherCharge(index, 'description', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Descripción"
                      />
                      <input
                        type="number"
                        value={charge.amount}
                        onChange={(e) => updateOtherCharge(index, 'amount', e.target.value)}
                        className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Monto"
                      />
                      {formData.otherCharges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOtherCharge(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addOtherCharge}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    + Agregar cargo
                  </button>
                </div>
              </div>

              {/* Payment details */}
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="ARS">ARS</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) =>
                        setFormData({ ...formData, paymentMethod: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="dolares">Dólares</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
                  Generar Recibo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptsManager;