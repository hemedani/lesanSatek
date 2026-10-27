/**
 * Pure accounting math and report assembly.
 *
 * Kept free of Lesan/Mongo imports so it can be unit-tested without booting
 * the application or opening a database connection.
 */

export type ReportRow = {
  _id?: unknown;
  code?: unknown;
  name?: unknown;
  accountType?: unknown;
  normalBalance?: unknown;
  debit?: unknown;
  credit?: unknown;
};

export type TrialBalanceAccount = {
  accountId: string;
  code: string;
  name: string;
  accountType: string;
  normalBalance: string;
  debit: number;
  credit: number;
  balance: number;
};

export type TrialBalanceReport = {
  accounts: TrialBalanceAccount[];
  totals: {
    debit: number;
    credit: number;
    difference: number;
  };
};

export type IncomeStatementAccount = {
  accountId: string;
  code: string;
  name: string;
  accountType: string;
  debit: number;
  credit: number;
  amount: number;
};

export type IncomeStatementReport = {
  revenue: IncomeStatementAccount[];
  expenses: IncomeStatementAccount[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
};

export type AccountingPeriodBounds = {
  code: string;
  name: string;
  startDate: Date;
  endDate: Date;
};

const assertValidDate = (date: Date): void => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error("Invalid accounting date");
  }
};

const asString = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

const asNumber = (value: unknown): number => {
  const numeric = Number(value);

  return Number.isFinite(numeric) ? numeric : 0;
};

export const roundMoney = (value: number): number => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) return 0;

  return Math.round(numeric * 100) / 100;
};

export const accountingPeriodBoundsFor = (
  date: Date,
): AccountingPeriodBounds => {
  assertValidDate(date);

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const code = `${year}-${String(month + 1).padStart(2, "0")}`;

  return {
    code,
    name: `Period ${code}`,
    startDate: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
    endDate: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  };
};

export type IdempotencyKeyInput = {
  sourceType: string;
  sourceId?: string;
  sourceEvent?: string;
  explicitKey?: string;
};

export const buildIdempotencyKey = (
  input: IdempotencyKeyInput,
): string =>
  input.explicitKey ||
  `${input.sourceType}:${input.sourceId ?? "none"}:${
    input.sourceEvent ?? "posted"
  }`;

export const buildEntryNumber = (date: Date, suffix: string): string => {
  assertValidDate(date);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `JE-${year}${month}${day}-${suffix.toUpperCase()}`;
};

export const buildTrialBalance = (
  rows: ReportRow[],
): TrialBalanceReport => {
  const accounts = rows.map((row) => {
    const debit = roundMoney(asNumber(row.debit));
    const credit = roundMoney(asNumber(row.credit));

    return {
      accountId: asString(row._id),
      code: asString(row.code),
      name: asString(row.name),
      accountType: asString(row.accountType),
      normalBalance: asString(row.normalBalance),
      debit,
      credit,
      balance: roundMoney(debit - credit),
    };
  });

  const totals = accounts.reduce(
    (acc, account) => ({
      debit: roundMoney(acc.debit + account.debit),
      credit: roundMoney(acc.credit + account.credit),
    }),
    { debit: 0, credit: 0 },
  );

  return {
    accounts,
    totals: {
      ...totals,
      difference: roundMoney(totals.debit - totals.credit),
    },
  };
};

export const buildIncomeStatement = (
  rows: ReportRow[],
): IncomeStatementReport => {
  const revenue: IncomeStatementAccount[] = [];
  const expenses: IncomeStatementAccount[] = [];

  for (const row of rows) {
    const accountType = asString(row.accountType);
    if (accountType !== "revenue" && accountType !== "expense") continue;

    const debit = roundMoney(asNumber(row.debit));
    const credit = roundMoney(asNumber(row.credit));
    const account: IncomeStatementAccount = {
      accountId: asString(row._id),
      code: asString(row.code),
      name: asString(row.name),
      accountType,
      debit,
      credit,
      amount: accountType === "revenue"
        ? roundMoney(credit - debit)
        : roundMoney(debit - credit),
    };

    if (accountType === "revenue") revenue.push(account);
    else expenses.push(account);
  }

  const totalRevenue = roundMoney(
    revenue.reduce((sum, item) => sum + item.amount, 0),
  );
  const totalExpenses = roundMoney(
    expenses.reduce((sum, item) => sum + item.amount, 0),
  );

  return {
    revenue,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: roundMoney(totalRevenue - totalExpenses),
  };
};
