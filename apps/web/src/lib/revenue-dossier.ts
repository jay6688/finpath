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
