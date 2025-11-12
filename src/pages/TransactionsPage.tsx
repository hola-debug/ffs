import Header from '../components/Header';
import { useUserTransactions } from '../hooks/useUserTransactions';

const tableHeaders = ['Fecha', 'Cuenta', 'Categoría', 'Descripción', 'Monto'];

function formatCurrency(value: number, currency = 'UYU') {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es-UY', {
    weekday: 'short',
    day: 'numeric',
    month: 'numeric',
  });
}

export default function TransactionsPage() {
  const { transactions, loading, error, refetch } = useUserTransactions();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-[#D5D5D5] w-full overflow-x-hidden box-border pt-24 pb-12 px-2 sm:px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.4em] text-gray-500">
                Transacciones
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black">
                Planilla de gastos
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Listado completo de movimientos creados por tu usuario en FFS.
              </p>
            </div>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold tracking-wide uppercase shadow hover:bg-gray-900 transition-colors self-start sm:self-auto"
            >
              Actualizar
            </button>
          </div>

          <section className="bg-white rounded-[26px] shadow-xl border border-black/5 p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#ECECEC] text-gray-600 uppercase tracking-wide text-xs">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th key={header} className="px-4 py-3 text-left">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Cargando transacciones...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="px-4 py-6 text-center text-red-500"
                      >
                        {error}
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={tableHeaders.length}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Todavía no registraste movimientos.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, index) => (
                      <tr
                        key={tx.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-[#F9F1F6]'}
                      >
                        <td className="px-4 py-3 font-semibold text-gray-700">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {tx.account?.name || 'Sin cuenta'}
                        </td>
                        <td className="px-4 py-3 text-gray-900">
                          {tx.category?.name || 'Sin categoría'}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {tx.description || tx.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#FF004D]">
                          {formatCurrency(tx.amount, tx.currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
