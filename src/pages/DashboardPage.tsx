import { useDashboardData } from '../hooks/useDashboardData';
import { 
  DailyBalanceModule, 
  DailyExpensesModule, 
  SavingsModule, 
  MonthlyIncomeModule, 
  DayCounterModule, 
  RandomExpensesModule 
} from '../components/modules';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { loading, error, ...data } = useDashboardData();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };



  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border">
      <div className="max-w-4xl mx-auto w-full box-border px-2 sm:px-4 py-2 sm:py-4">
      

        <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full box-border">
          <DailyBalanceModule data={data.dailySpendable} onRefresh={data.refetch} />
      
        </div>
      </div>
    </div>
  );
}
