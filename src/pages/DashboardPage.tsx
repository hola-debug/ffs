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
  console.log('📄 DashboardPage COMPONENT RENDERED');
  const { loading, error, justUpdated, ...data } = useDashboardData();
  console.log('📊 Dashboard data:', { loading, error, hasData: !!data });
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
        {/* Real-time update indicator */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: justUpdated ? 1 : 0, y: justUpdated ? 0 : -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Actualizando...
          </div>
        </motion.div>
        
        <div className="max-w-4xl mx-auto w-full box-border px-2 sm:px-4 py-2 sm:py-4">
          <motion.div 
            className="grid grid-cols-2 gap-2 sm:gap-4 w-full box-border"
            variants={containerVariants}
            initial="hidden"
            animate={justUpdated ? "pulse" : "visible"}
            variants={{
              ...containerVariants,
              pulse: {
                opacity: 1,
                scale: [1, 1.01, 1],
                transition: {
                  duration: 0.4,
                  ease: "easeInOut",
                },
              },
            }}
          >
            <motion.div variants={itemVariants}>
              <DailyBalanceModule periods={data.periods} onRefresh={data.refetch} />
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
