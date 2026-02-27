import { useCallback, useMemo, useState } from 'react';
import { collection, getDocs, setDoc, doc, writeBatch, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Property, Tenant, Receipt, CashMovement } from '../App';

type AnyRow = Property | Tenant | Receipt | CashMovement;

type CollectionName = 'properties' | 'tenants' | 'receipts' | 'cashMovements';

const COLLECTIONS: Record<CollectionName, CollectionName> = {
  properties: 'properties',
  tenants: 'tenants',
  receipts: 'receipts',
  cashMovements: 'cashMovements',
};

function ensureNumberId(row: any) {
  // Tu sistema usa id number. En Firestore el docId puede ser string,
  // pero nosotros guardamos también el campo id como number para compatibilidad.
  if (typeof row?.id !== 'number') {
    return { ...row, id: Number(row?.id ?? Date.now()) };
  }
  return row;
}

function docIdFromRow(row: any) {
  // Usamos el id numérico como docId para que sea determinístico
  const id = typeof row?.id === 'number' ? row.id : Number(row?.id ?? Date.now());
  return String(id);
}

export function useFirebaseDB() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async <T extends AnyRow>(colName: CollectionName): Promise<T[]> => {
    setLoading(true);
    setError(null);
    try {
      const colRef = collection(db, COLLECTIONS[colName]);
      // Orden por id si existe
      const q = query(colRef, orderBy('id'));
      const snap = await getDocs(q);

      const rows = snap.docs.map(d => {
        const data = d.data() as any;
        return ensureNumberId(data);
      });

      return rows as T[];
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Error cargando datos');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveOne = useCallback(async (colName: CollectionName, row: AnyRow) => {
    setLoading(true);
    setError(null);
    try {
      const clean = ensureNumberId(row);
      const id = docIdFromRow(clean);
      await setDoc(doc(db, COLLECTIONS[colName], id), clean, { merge: true });
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Error guardando dato');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const replaceAll = useCallback(async (colName: CollectionName, rows: AnyRow[]) => {
    setLoading(true);
    setError(null);
    try {
      // Para “replaceAll” real habría que borrar docs viejos.
      // Para mantenerlo simple y seguro: hacemos upsert masivo.
      const batch = writeBatch(db);
      rows.map(ensureNumberId).forEach((r) => {
        const id = docIdFromRow(r);
        batch.set(doc(db, COLLECTIONS[colName], id), r, { merge: false });
      });
      await batch.commit();
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Error guardando datos');
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const api = useMemo(() => {
    return {
      loading,
      error,
      setError,

      // Loads
      loadProperties: () => loadAll<Property>('properties'),
      loadTenants: () => loadAll<Tenant>('tenants'),
      loadReceipts: () => loadAll<Receipt>('receipts'),
      loadCashMovements: () => loadAll<CashMovement>('cashMovements'),

      // Saves
      saveProperty: (p: Property) => saveOne('properties', p),
      saveTenant: (t: Tenant) => saveOne('tenants', t),
      saveReceipt: (r: Receipt) => saveOne('receipts', r),
      saveCashMovement: (m: CashMovement) => saveOne('cashMovements', m),

      // Replace
      replaceAllProperties: (rows: Property[]) => replaceAll('properties', rows),
      replaceAllTenants: (rows: Tenant[]) => replaceAll('tenants', rows),
      replaceAllReceipts: (rows: Receipt[]) => replaceAll('receipts', rows),
      replaceAllCashMovements: (rows: CashMovement[]) => replaceAll('cashMovements', rows),
    };
  }, [loading, error, loadAll, saveOne, replaceAll]);

  return api;
}