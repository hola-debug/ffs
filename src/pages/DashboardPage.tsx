import { useDashboardData } from '../hooks/useDashboardData';
import { 
  DailyBalanceModule, 
  DailyExpensesModule, 
  AIInputModule,
  AccountsBalanceModule,
  FixedExpensesModule
} from '../components/modules';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

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
          <div className="grid grid-cols-2 gap-2 sm:gap-4 w-full box-border">
            
            {/* Módulo de Balance Disponible */}
            <DailyBalanceModule monthlySummary={data.monthlySummary} />

            {/* Módulo de Gastos de Hoy */}
            <DailyExpensesModule onRefresh={data.refetch} />

            {/* Bolsas de Gasto */}
            <div className="col-span-2 bg-white rounded-lg p-4 shadow">
              <h3 className="text-lg font-bold mb-3">👛 Bolsas de Gasto</h3>
              {data.expensePockets.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay bolsas de gasto activas</p>
              ) : (
                <div className="space-y-2">
                  {data.expensePockets.map((pocket) => (
                    <div key={pocket.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base">{pocket.emoji} {pocket.name}</h4>
                        <span className="text-sm text-gray-600">
                          {pocket.days_remaining} días
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Saldo: <span className="font-semibold">${pocket.current_balance.toLocaleString()}</span></span>
                        <span>Diario: <span className="font-semibold text-green-600">${pocket.remaining_daily_allowance?.toFixed(0)}</span></span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${(pocket.current_balance / pocket.allocated_amount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bolsas de Ahorro */}
            <div className="col-span-2 bg-white rounded-lg p-4 shadow">
              <h3 className="text-lg font-bold mb-3">🐷 Bolsas de Ahorro</h3>
              {data.savingPockets.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay bolsas de ahorro activas</p>
              ) : (
                <div className="space-y-2">
                  {data.savingPockets.map((pocket) => (
                    <div key={pocket.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-base">{pocket.emoji} {pocket.name}</h4>
                        <span className="text-sm font-bold text-blue-600">
                          {pocket.progress_percentage}%
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Ahorrado: <span className="font-semibold">${pocket.current_balance.toLocaleString()}</span></span>
                        <span>Meta: <span className="font-semibold">${pocket.target_amount?.toLocaleString()}</span></span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${pocket.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <AccountsBalanceModule accounts={data.accounts} />

            <FixedExpensesModule 
              accounts={data.accounts}
              categories={data.categories}
              onRefresh={data.refetch}
            />

            {/* Módulo de entrada con IA (texto y voz) */}
            <AIInputModule onRefresh={data.refetch} />
          </div>
        </div>
      </div>
    </>
  );
}
