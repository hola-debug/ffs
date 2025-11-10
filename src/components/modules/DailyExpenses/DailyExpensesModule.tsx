import { BaseCard } from '../BaseCard';

interface DailyExpensesModuleProps {
  className?: string;
}

export function DailyExpensesModule({ className }: DailyExpensesModuleProps) {
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
            className="flex items-center justify-center p-4 rounded-lg"
            style={{ backgroundColor: '#00D73D' }}
          >
            <span className="text-2xl font-bold text-white">FFS.FINANCE</span>
          </div>
        </div>
      </div>
    </BaseCard>
  );
}