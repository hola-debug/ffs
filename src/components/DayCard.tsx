export default function DayCard() {
  const today = new Date().getDate();

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-lg p-6 shadow-lg flex items-center justify-center">
      <div className="text-center">
        <p className="text-lg font-medium mb-2">Día del mes</p>
        <div className="text-7xl font-bold">{today}</div>
      </div>
    </div>
  );
}
