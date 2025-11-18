// Code node (JavaScript)

// 1) Obtener las filas desde el input
// Caso 1: el node anterior ya manda un array en un único item: items[0].json
// Caso 2: cada fila viene como un item separado: items[x].json
const items = $input.all();

let rows;

// Si el primer item es un array completo
if (items.length === 1 && Array.isArray(items[0].json)) {
  rows = items[0].json;
} else if (items.length === 1 && Array.isArray(items[0].json.data)) {
  // O si viene en json.data
  rows = items[0].json.data;
} else {
  // Si cada item es una fila
  rows = items.map(item => item.json);
}

// Helpers
const limpiarNumero = (v) =>
  v === "" || v == null ? 0 : parseFloat(String(v).toString().replace(",", "."));

const limpiarFecha = (v) => {
  if (!v) return null;
  const partes = String(v).split("/");
  // dd/mm/yyyy
  if (partes.length === 3) {
    const [d, m, y] = partes;
    return new Date(`${y}-${m}-${d}`).toISOString().split("T")[0];
  }
  // dd/mm -> asumo año actual
  if (partes.length === 2) {
    const [d, m] = partes;
    const y = new Date().getFullYear();
    return new Date(`${y}-${m}-${d}`).toISOString().split("T")[0];
  }
  return v;
};

// 2) Meta: cliente, cuenta, divisa (primer valor no vacío que encuentre)
const meta = {
  cliente: null,
  cuenta: null,
  divisa: null,
};

for (const r of rows) {
  if (!meta.cliente && r["cliente:"] && String(r["cliente:"]).trim() !== "") {
    meta.cliente = String(r["cliente:"]).trim();
  }
  if (!meta.cuenta && r.cuenta && String(r.cuenta).trim() !== "") {
    meta.cuenta = String(r.cuenta).trim();
  }
  if (!meta.divisa && r.divisa && String(r.divisa).trim() !== "") {
    meta.divisa = String(r.divisa).trim();
  }
}

// 3) Movimientos (solo filas con DEBE o HABER numéricos)
const movimientos = rows
  .filter((r) => limpiarNumero(r.DEBE) !== 0 || limpiarNumero(r.HABER) !== 0)
  .map((r) => {
    const debe = limpiarNumero(r.DEBE);
    const haber = limpiarNumero(r.HABER);
    return {
      row_number: r.row_number,
      fecha_raw: r.FECHA,
      fecha: limpiarFecha(r.FECHA),
      concepto: r.CONCEPTO ? String(r.CONCEPTO).trim() : "",
      debe,
      haber,
      balance: limpiarNumero(r.BALANCE),
      tipo: debe > 0 ? "DEBE" : "HABER",
    };
  })
  // Ordenar por fecha
  .sort((a, b) => {
    if (!a.fecha && !b.fecha) return 0;
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return new Date(a.fecha) - new Date(b.fecha);
  });

// 4) Resumen
const totalDebe = movimientos.reduce((acc, m) => acc + m.debe, 0);
const totalHaber = movimientos.reduce((acc, m) => acc + m.haber, 0);
const balanceFinal = totalHaber - totalDebe;

// 5) Devolver en formato n8n: array de items
return [
  {
    json: {
      meta,
      movimientos,
      resumen: {
        totalDebe,
        totalHaber,
        balanceFinal,
      },
    },
  },
];

