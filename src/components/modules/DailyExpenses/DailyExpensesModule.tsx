'use client';

import { BaseCard } from '../BaseCard';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useMemo } from 'react';

interface DailyExpensesModuleProps {
  className?: string;
}

export function DailyExpensesModule({ className }: DailyExpensesModuleProps) {
  const { dailySpendable, loading } = useDashboardData();

  // Determinar el color según la condición
  const blockColor = useMemo(() => {
    if (!dailySpendable) {
      console.log('No dailySpendable data');
      return '#00D73D';
    }
    
    console.log('dailySpendable:', dailySpendable);
    console.log('gastos_hoy:', dailySpendable.gastos_hoy, 'saldo_diario_hoy:', dailySpendable.saldo_diario_hoy);
    
    // Si gastos de hoy > saldo diario hoy = rojo
    if (dailySpendable.gastos_hoy > dailySpendable.saldo_diario_hoy) {
      console.log('Color rojo');
      return '#FF0000'; // Rojo
    }
    
    console.log('Color verde');
    return '#00D73D'; // Verde
  }, [dailySpendable]);

  return (
    <BaseCard className={`relative overflow-hidden ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="text-lg font-semibold mb-4">
          Daily Expenses
        </div>

        {/* Content Area */}
        <div className="flex-grow">
          {/* Add your content here */}
        </div>

        {/* Bottom Logo Section */}
        <div className="mt-auto pt-4">
          <div 
            className="flex items-center justify-center p-4 rounded-lg transition-colors duration-300"
            style={{ backgroundColor: loading ? '#00D73D' : blockColor }}
          >
          </div>
        </div>
      </div>
    </BaseCard>
  );
}
