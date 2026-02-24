import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Property, Tenant, Receipt, CashMovement } from '../App';

export const useSupabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para manejar errores
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(`Error en ${operation}: ${error.message}`);
    setLoading(false);
  };

  // PROPIEDADES
  const loadProperties = async (): Promise<Property[]> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLoading(false);
      return data || [];
    } catch (error) {
      handleError(error, 'cargar propiedades');
      return [];
    }
  };

  const saveProperty = async (property: Omit<Property, 'id'> | Property): Promise<Property | null> => {
    setLoading(true);
    setError(null);

    try {
      if ('id' in property && property.id) {
        // Actualizar propiedad existente
        const { data, error } = await supabase
          .from('properties')
          .update({
            name: property.name,
            type: property.type,
            building: property.building,
            address: property.address,
            rent: property.rent,
            expenses: property.expenses,
            tenant: property.tenant,
            status: property.status,
            contract_start: property.contractStart,
            contract_end: property.contractEnd,
            last_updated: property.lastUpdated,
            notes: property.notes
          })
          .eq('id', property.id)
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return data;
      } else {
        // Crear nueva propiedad
        const { data, error } = await supabase
          .from('properties')
          .insert({
            name: property.name,
            type: property.type,
            building: property.building,
            address: property.address,
            rent: property.rent,
            expenses: property.expenses,
            tenant: property.tenant,
            status: property.status,
            contract_start: property.contractStart,
            contract_end: property.contractEnd,
            last_updated: property.lastUpdated,
            notes: property.notes
          })
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return data;
      }
    } catch (error) {
      handleError(error, 'guardar propiedad');
      return null;
    }
  };

  const deleteProperty = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLoading(false);
      return true;
    } catch (error) {
      handleError(error, 'eliminar propiedad');
      return false;
    }
  };

  // INQUILINOS
  const loadTenants = async (): Promise<Tenant[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const tenants: Tenant[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        propertyId: item.property_id,
        property: item.property,
        contractStart: item.contract_start,
        contractEnd: item.contract_end,
        deposit: item.deposit,
        guarantor: {
          name: item.guarantor_name,
          email: item.guarantor_email,
          phone: item.guarantor_phone
        },
        balance: item.balance,
        status: item.status
      }));

      setLoading(false);
      return tenants;
    } catch (error) {
      handleError(error, 'cargar inquilinos');
      return [];
    }
  };

  const saveTenant = async (tenant: Omit<Tenant, 'id'> | Tenant): Promise<Tenant | null> => {
    setLoading(true);
    setError(null);

    try {
      const tenantData = {
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        property_id: tenant.propertyId,
        property: tenant.property,
        contract_start: tenant.contractStart,
        contract_end: tenant.contractEnd,
        deposit: tenant.deposit,
        guarantor_name: tenant.guarantor.name,
        guarantor_email: tenant.guarantor.email,
        guarantor_phone: tenant.guarantor.phone,
        balance: tenant.balance,
        status: tenant.status
      };

      if ('id' in tenant && tenant.id) {
        // Actualizar inquilino existente
        const { data, error } = await supabase
          .from('tenants')
          .update(tenantData)
          .eq('id', tenant.id)
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          propertyId: data.property_id,
          property: data.property,
          contractStart: data.contract_start,
          contractEnd: data.contract_end,
          deposit: data.deposit,
          guarantor: {
            name: data.guarantor_name,
            email: data.guarantor_email,
            phone: data.guarantor_phone
          },
          balance: data.balance,
          status: data.status
        };
      } else {
        // Crear nuevo inquilino
        const { data, error } = await supabase
          .from('tenants')
          .insert(tenantData)
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          phone: data.phone,
          propertyId: data.property_id,
          property: data.property,
          contractStart: data.contract_start,
          contractEnd: data.contract_end,
          deposit: data.deposit,
          guarantor: {
            name: data.guarantor_name,
            email: data.guarantor_email,
            phone: data.guarantor_phone
          },
          balance: data.balance,
          status: data.status
        };
      }
    } catch (error) {
      handleError(error, 'guardar inquilino');
      return null;
    }
  };

  const deleteTenant = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setLoading(false);
      return true;
    } catch (error) {
      handleError(error, 'eliminar inquilino');
      return false;
    }
  };

  // RECIBOS
  const loadReceipts = async (): Promise<Receipt[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const receipts: Receipt[] = (data || []).map(item => ({
        id: item.id,
        receiptNumber: item.receipt_number,
        tenant: item.tenant,
        property: item.property,
        building: item.building,
        month: item.month,
        year: item.year,
        rent: item.rent,
        expenses: item.expenses,
        otherCharges: item.other_charges || [],
        previousBalance: item.previous_balance,
        total: item.total,
        paidAmount: item.paid_amount,
        remainingBalance: item.remaining_balance,
        currency: item.currency,
        paymentMethod: item.payment_method,
        status: item.status,
        dueDate: item.due_date,
        createdDate: item.created_date
      }));

      setLoading(false);
      return receipts;
    } catch (error) {
      handleError(error, 'cargar recibos');
      return [];
    }
  };

  const saveReceipt = async (receipt: Omit<Receipt, 'id'> | Receipt): Promise<Receipt | null> => {
    setLoading(true);
    setError(null);

    try {
      const receiptData = {
        receipt_number: receipt.receiptNumber,
        tenant: receipt.tenant,
        property: receipt.property,
        building: receipt.building,
        month: receipt.month,
        year: receipt.year,
        rent: receipt.rent,
        expenses: receipt.expenses,
        other_charges: receipt.otherCharges,
        previous_balance: receipt.previousBalance,
        total: receipt.total,
        paid_amount: receipt.paidAmount,
        remaining_balance: receipt.remainingBalance,
        currency: receipt.currency,
        payment_method: receipt.paymentMethod,
        status: receipt.status,
        due_date: receipt.dueDate,
        created_date: receipt.createdDate
      };

      if ('id' in receipt && receipt.id) {
        // Actualizar recibo existente
        const { data, error } = await supabase
          .from('receipts')
          .update(receiptData)
          .eq('id', receipt.id)
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return {
          id: data.id,
          receiptNumber: data.receipt_number,
          tenant: data.tenant,
          property: data.property,
          building: data.building,
          month: data.month,
          year: data.year,
          rent: data.rent,
          expenses: data.expenses,
          otherCharges: data.other_charges || [],
          previousBalance: data.previous_balance,
          total: data.total,
          paidAmount: data.paid_amount,
          remainingBalance: data.remaining_balance,
          currency: data.currency,
          paymentMethod: data.payment_method,
          status: data.status,
          dueDate: data.due_date,
          createdDate: data.created_date
        };
      } else {
        // Crear nuevo recibo
        const { data, error } = await supabase
          .from('receipts')
          .insert(receiptData)
          .select()
          .single();

        if (error) throw error;
        setLoading(false);
        return {
          id: data.id,
          receiptNumber: data.receipt_number,
          tenant: data.tenant,
          property: data.property,
          building: data.building,
          month: data.month,
          year: data.year,
          rent: data.rent,
          expenses: data.expenses,
          otherCharges: data.other_charges || [],
          previousBalance: data.previous_balance,
          total: data.total,
          paidAmount: data.paid_amount,
          remainingBalance: data.remaining_balance,
          currency: data.currency,
          paymentMethod: data.payment_method,
          status: data.status,
          dueDate: data.due_date,
          createdDate: data.created_date
        };
      }
    } catch (error) {
      handleError(error, 'guardar recibo');
      return null;
    }
  };

  // MOVIMIENTOS DE CAJA
  const loadCashMovements = async (): Promise<CashMovement[]> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const movements: CashMovement[] = (data || []).map(item => ({
        id: item.id,
        type: item.type,
        description: item.description,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        date: item.date,
        tenant: item.tenant,
        property: item.property,
        comment: item.comment
      }));

      setLoading(false);
      return movements;
    } catch (error) {
      handleError(error, 'cargar movimientos de caja');
      return [];
    }
  };

  const saveCashMovement = async (movement: Omit<CashMovement, 'id'>): Promise<CashMovement | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cash_movements')
        .insert({
          type: movement.type,
          description: movement.description,
          category: movement.category,
          amount: movement.amount,
          currency: movement.currency,
          date: movement.date,
          tenant: movement.tenant,
          property: movement.property,
          comment: movement.comment
        })
        .select()
        .single();

      if (error) throw error;
      setLoading(false);
      return {
        id: data.id,
        type: data.type,
        description: data.description,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        date: data.date,
        tenant: data.tenant,
        property: data.property,
        comment: data.comment
      };
    } catch (error) {
      handleError(error, 'guardar movimiento de caja');
      return null;
    }
  };

  return {
    loading,
    error,
    setError,
    // Propiedades
    loadProperties,
    saveProperty,
    deleteProperty,
    // Inquilinos
    loadTenants,
    saveTenant,
    deleteTenant,
    // Recibos
    loadReceipts,
    saveReceipt,
    // Movimientos de caja
    loadCashMovements,
    saveCashMovement
  };
};