import { useDashboardData } from '../hooks/useDashboardData';
import { 
  DailyBalanceModule, 
  DailyExpensesModule, 
  SavingsModule, 
  MonthlyIncomeModule, 
  DayCounterModule, 
  RandomExpensesModule,
  AIInputModule,
  PeriodBalanceModule,
  AccountsBalanceModule
} from '../components/modules';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import { useDashboardSync } from '../hooks/useDashboardSync';

// Variantes de animación Tetris (deslizamiento desde abajo)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

// Animación tipo Tetris: entrada desde abajo
const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.34, 1.56, 0.64, 1], // cubic-bezier para efecto de rebote suave
    },
  },
};

export default function DashboardPage() {
  const { loading, error, ...data } = useDashboardData();
  const navigate = useNavigate();
  useDashboardSync();

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

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20" />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-20">
        <div className="max-w-4xl mx-auto w-full box-border px-2 sm:px-4 py-2 sm:py-4">
          <motion.div 
            className="grid grid-cols-2 gap-2 sm:gap-4 w-full box-border"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <DailyBalanceModule data={data.dailySpendable} onRefresh={data.refetch} />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <DailyExpensesModule 
                data={data.todayExpenses} 
                accounts={data.accounts}
                categories={data.categories}
                periods={data.periods}
                onRefresh={data.refetch}
              />
            </motion.div>

            {/* Módulo de Período */}
            <motion.div variants={itemVariants}>
              <PeriodBalanceModule 
                periods={data.periods}
                accounts={data.accounts}
                onRefresh={data.refetch}
              />
            </motion.div>

            {/* Módulo de entrada con IA */}
            <motion.div variants={itemVariants}>
              <AIInputModule onRefresh={data.refetch} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <AccountsBalanceModule accounts={data.accounts} />
            </motion.div>

            {/* Módulo de entrada con IA */}
            <motion.div variants={itemVariants}>
              <AIInputModule onRefresh={data.refetch} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
