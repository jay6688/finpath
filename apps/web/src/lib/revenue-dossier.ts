export type FiscalYearRecord = {
  fact: {
    fiscalYear: number;
  };
};

export function selectRevenueRecord<T extends FiscalYearRecord>(
  records: readonly T[],
  fiscalYear: number,
): T {
  const selected = records.find(
    (record) => record.fact.fiscalYear === fiscalYear,
  );
  if (!selected) {
    throw new Error(`Revenue for FY${fiscalYear} is not available.`);
  }
  return selected;
}

export function moveRevenueSelection<T extends FiscalYearRecord>(
  records: readonly T[],
  fiscalYear: number,
  direction: -1 | 1,
): number {
  const currentIndex = records.findIndex(
    (record) => record.fact.fiscalYear === fiscalYear,
  );
  if (currentIndex === -1 || records.length === 0) {
    throw new Error(`Revenue for FY${fiscalYear} is not available.`);
  }
  const nextIndex = (currentIndex + direction + records.length) % records.length;
  return records[nextIndex].fact.fiscalYear;
}
