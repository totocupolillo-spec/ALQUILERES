import React from 'react';
import { CashMovement } from '../App';

interface CashRegisterProps {
  cashMovements: CashMovement[];
  setCashMovements: React.Dispatch<React.SetStateAction<CashMovement[]>>;
  supabaseHook: any;
  user: any;
}

const CashRegister: React.FC<CashRegisterProps> = ({
  cashMovements,
}) => {

  const balance = cashMovements.reduce((sum, m) => {
    return m.type === 'income'
      ? sum + m.amount
      : sum - m.amount;
  }, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Arqueo</h2>

      <div className="bg-white p-6 rounded-xl shadow">
        <p className="text-gray-600">Saldo Actual</p>
        <p className="text-3xl font-bold text-blue-600">
          ${balance.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default CashRegister;