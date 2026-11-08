/** Paginate financial records; never report a silently truncated total. */
export async function fetchAllFinancialRows(makeQuery: () => any, pageSize = 500): Promise<any[]> {
  const rows: any[] = [];
  const seen = new Set<string>();
  for (let page = 0; page < 1000; page++) {
    const start = page * pageSize;
    const { data, error } = await makeQuery().range(start, start + pageSize - 1);
    if (error) throw error;
    const batch = data ?? [];
    for (const row of batch) {
      if (typeof row.id === "string") {
        if (seen.has(row.id)) throw new Error("Registro financeiro duplicado entre páginas.");
        seen.add(row.id);
      }
      rows.push(row);
    }
    if (batch.length < pageSize) return rows;
  }
  throw new Error("Limite seguro de paginação financeira atingido; relatório incompleto não exibido.");
}
export async function fetchFinancialRowsByIds(ids: string[], makeQuery: (ids: string[]) => any): Promise<any[]> {
  const rows: any[] = [];
  if (new Set(ids).size !== ids.length) throw new Error("Identificadores financeiros duplicados.");
  for (let i = 0; i < ids.length; i += 100) {
    rows.push(...await fetchAllFinancialRows(() => makeQuery(ids.slice(i, i + 100))));
  }
  return rows;
}
