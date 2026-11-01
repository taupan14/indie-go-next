export type Level = { key: "newcomer" | "active" | "popular" | "figure"; min: number };

export const DEFAULT_LEVELS: Level[] = [
  { key: "newcomer", min: 0 }, { key: "active", min: 50 }, { key: "popular", min: 150 }, { key: "figure", min: 300 },
];

/** Ambang level dari tabel app_settings (key "popularity"); jatuh ke nilai bawaan jika kosong. */
export function levelsFrom(value: any): Level[] {
  const l = value?.levels;
  return l ? [{ key: "newcomer", min: 0 }, { key: "active", min: +l.active }, { key: "popular", min: +l.popular }, { key: "figure", min: +l.figure }] : DEFAULT_LEVELS;
}

export function levelOf(points: number, levels: Level[] = DEFAULT_LEVELS) {
  let i = 0;
  levels.forEach((l, idx) => { if (points >= l.min) i = idx; });
  const next = levels[i + 1]?.min ?? null; // null = level tertinggi
  return { key: levels[i].key, next, fraction: next ? Math.min(1, points / next) : 1 };
}
