/**
 * Unit tests for the pure accounting helpers (no database, no server).
 *
 * These cover the deterministic math that every journal entry and financial
 * report depends on: money rounding, period boundaries, idempotency keys,
 * entry numbers, trial balance and income statement assembly.
 */
import { assert, assertEquals, assertThrows } from "@std/assert";
import {
  accountingPeriodBoundsFor,
  buildEntryNumber,
  buildIdempotencyKey,
  buildIncomeStatement,
  buildTrialBalance,
  roundMoney,
} from "../../utils/accountingMath.ts";

Deno.test("roundMoney rounds to two decimals", () => {
  assertEquals(roundMoney(10.234), 10.23);
  assertEquals(roundMoney(10.235), 10.24);
  assertEquals(roundMoney(0), 0);
  assertEquals(roundMoney(2500000), 2500000);
});

Deno.test("roundMoney treats non-numeric input as zero", () => {
  assertEquals(roundMoney(Number.NaN), 0);
  assertEquals(roundMoney(Number.POSITIVE_INFINITY), 0);
});

Deno.test("roundMoney removes floating point drift", () => {
  assertEquals(roundMoney(0.1 + 0.2), 0.3);
  assertEquals(roundMoney(1.1 * 3), 3.3);
});

Deno.test("accountingPeriodBoundsFor builds UTC monthly bounds", () => {
  const bounds = accountingPeriodBoundsFor(new Date("2024-01-15T10:30:00Z"));

  assertEquals(bounds.code, "2024-01");
  assertEquals(bounds.name, "Period 2024-01");
  assertEquals(bounds.startDate.toISOString(), "2024-01-01T00:00:00.000Z");
  assertEquals(bounds.endDate.toISOString(), "2024-01-31T23:59:59.999Z");
});

Deno.test("accountingPeriodBoundsFor handles December", () => {
  const bounds = accountingPeriodBoundsFor(new Date("2023-12-31T23:00:00Z"));

  assertEquals(bounds.code, "2023-12");
  assertEquals(bounds.startDate.toISOString(), "2023-12-01T00:00:00.000Z");
  assertEquals(bounds.endDate.toISOString(), "2023-12-31T23:59:59.999Z");
});

Deno.test("accountingPeriodBoundsFor handles leap February", () => {
  const bounds = accountingPeriodBoundsFor(new Date("2024-02-10T00:00:00Z"));

  assertEquals(bounds.code, "2024-02");
  assertEquals(bounds.endDate.toISOString(), "2024-02-29T23:59:59.999Z");
});

Deno.test("buildIdempotencyKey uses an explicit key verbatim", () => {
  assertEquals(
    buildIdempotencyKey({
      sourceType: "manual",
      sourceId: "ignored",
      sourceEvent: "ignored",
      explicitKey: "my-key",
    }),
    "my-key",
  );
});

Deno.test("buildIdempotencyKey composes type, source and event", () => {
  assertEquals(
    buildIdempotencyKey({
      sourceType: "goodsReceipt",
      sourceId: "receipt-1",
      sourceEvent: "receipt",
    }),
    "goodsReceipt:receipt-1:receipt",
  );
});

Deno.test("buildIdempotencyKey falls back to placeholders", () => {
  assertEquals(
    buildIdempotencyKey({ sourceType: "manual" }),
    "manual:none:posted",
  );
});

Deno.test("buildEntryNumber formats the date and uppercase suffix", () => {
  assertEquals(
    buildEntryNumber(new Date("2024-02-03T00:00:00Z"), "ab12cd"),
    "JE-20240203-AB12CD",
  );
});

Deno.test("buildTrialBalance returns per-account balances and totals", () => {
  const report = buildTrialBalance([
    {
      _id: "acc-cash",
      code: "1010",
      name: "Cash",
      accountType: "asset",
      normalBalance: "debit",
      debit: 300,
      credit: 50,
    },
    {
      _id: "acc-revenue",
      code: "4000",
      name: "Revenue",
      accountType: "revenue",
      normalBalance: "credit",
      debit: 0,
      credit: 250,
    },
  ]);

  assertEquals(report.accounts.length, 2);
  assertEquals(report.accounts[0], {
    accountId: "acc-cash",
    code: "1010",
    name: "Cash",
    accountType: "asset",
    normalBalance: "debit",
    debit: 300,
    credit: 50,
    balance: 250,
  });
  assertEquals(report.totals.debit, 300);
  assertEquals(report.totals.credit, 300);
  assertEquals(report.totals.difference, 0);
});

Deno.test("buildTrialBalance rounds and tolerates missing fields", () => {
  const report = buildTrialBalance([
    { _id: "a", debit: 10.235, credit: 0 },
    { _id: "b", debit: 0, credit: 10.235 },
    {},
  ]);

  assertEquals(report.accounts[0].debit, 10.24);
  assertEquals(report.accounts[1].credit, 10.24);
  assertEquals(report.accounts[2].accountId, "");
  assertEquals(report.accounts[2].balance, 0);
  assertEquals(report.totals.difference, 0);
});

Deno.test("buildTrialBalance reports a non-zero difference for unbalanced data", () => {
  const report = buildTrialBalance([
    { _id: "a", debit: 100, credit: 0 },
    { _id: "b", debit: 0, credit: 90 },
  ]);

  assertEquals(report.totals.difference, 10);
});

Deno.test("buildTrialBalance handles an empty ledger", () => {
  const report = buildTrialBalance([]);

  assertEquals(report.accounts, []);
  assertEquals(report.totals, { debit: 0, credit: 0, difference: 0 });
});

Deno.test("buildIncomeStatement separates revenue and expenses", () => {
  const report = buildIncomeStatement([
    {
      _id: "rev-1",
      code: "4000",
      name: "Revenue",
      accountType: "revenue",
      debit: 20,
      credit: 120,
    },
    {
      _id: "exp-1",
      code: "5100",
      name: "COGS",
      accountType: "expense",
      debit: 45,
      credit: 5,
    },
  ]);

  assertEquals(report.revenue.length, 1);
  assertEquals(report.expenses.length, 1);
  assertEquals(report.revenue[0].amount, 100);
  assertEquals(report.expenses[0].amount, 40);
  assertEquals(report.totalRevenue, 100);
  assertEquals(report.totalExpenses, 40);
  assertEquals(report.netIncome, 60);
});

Deno.test("buildIncomeStatement ignores non-P&L accounts", () => {
  const report = buildIncomeStatement([
    {
      _id: "asset-1",
      code: "1010",
      name: "Cash",
      accountType: "asset",
      debit: 500,
      credit: 0,
    },
  ]);

  assertEquals(report.revenue, []);
  assertEquals(report.expenses, []);
  assertEquals(report.totalRevenue, 0);
  assertEquals(report.totalExpenses, 0);
  assertEquals(report.netIncome, 0);
});

Deno.test("buildIncomeStatement reports a net loss", () => {
  const report = buildIncomeStatement([
    {
      _id: "rev-1",
      code: "4000",
      name: "Revenue",
      accountType: "revenue",
      debit: 0,
      credit: 50,
    },
    {
      _id: "exp-1",
      code: "5100",
      name: "COGS",
      accountType: "expense",
      debit: 80,
      credit: 0,
    },
  ]);

  assertEquals(report.netIncome, -30);
});

Deno.test("period and entry helpers reject invalid dates", () => {
  assertThrows(() => accountingPeriodBoundsFor(new Date("invalid")));
  assertThrows(() => buildEntryNumber(new Date("invalid"), "abc"));
  assert(true);
});
