/**
 * Integration tests for the accounting engine against a real MongoDB.
 *
 * A throwaway database (lesanSatek_test_*) is used and dropped afterwards, so
 * these tests never touch the development/production database.
 *
 * Run with: deno task test
 */
import { assert, assertEquals, assertRejects } from "@std/assert";
import { MongoClient, ObjectId } from "lesan";

const RUN_ID = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const DB_NAME = `lesanSatek_test_${RUN_ID}`;
const MONGO_URI = Deno.env.get("MONGO_URI") || "mongodb://127.0.0.1:27017/";

Deno.env.set("MONGO_DB", DB_NAME);
Deno.env.set("APP_PORT", "0");
Deno.env.set("ENV", "test");

type Doc = Record<string, unknown>;
type Model = {
  insertOne: (args: unknown) => Promise<Doc | null>;
  findOne: (args: unknown) => Promise<Doc | null>;
  find: (args: unknown) => { toArray: () => Promise<Doc[]> };
  findOneAndUpdate: (args: unknown) => Promise<Doc | null>;
  countDocument: (args: unknown) => Promise<number>;
  deleteOne: (args: unknown) => Promise<unknown>;
};

const mod = await import("../../mod.ts") as unknown as {
  user: Model;
  organization: Model;
  unit: Model;
  account: Model;
  accountingPeriod: Model;
  costCenter: Model;
  journalEntry: Model;
  journalEntryLine: Model;
};

const {
  user,
  organization,
  unit,
  account,
  accountingPeriod,
  costCenter,
  journalEntry,
  journalEntryLine,
} = mod;

const engine = await import("../../utils/accountingEngine.ts");
const {
  DEFAULT_CHART_OF_ACCOUNTS,
  ensureAccountingPeriod,
  ensureDefaultChartOfAccounts,
  postJournalEntry,
  recordConsumptionAccounting,
  recordGoodsReceiptAccounting,
  recordPaymentAccounting,
} = engine;

const idOf = (doc: Doc | null | undefined): string => String(doc?._id);

const createUser = async (label: string): Promise<string> => {
  const created = await user.insertOne({
    doc: {
      first_name: "Accounting",
      last_name: label,
      gender: "Male",
      mobile: `0912${String(Math.floor(Math.random() * 1e7)).padStart(7, "0")}`,
      email: `accounting_${label}_${RUN_ID}@example.com`,
      password: "not-used",
      isGhost: true,
      roles: [{ roleId: crypto.randomUUID(), name: "Ordinary" }],
    },
    projection: { _id: 1 },
  });

  return idOf(created);
};

const createOrganization = async (
  creatorId: string,
  label: string,
): Promise<string> => {
  const created = await organization.insertOne({
    doc: { name: `Accounting Org ${label}`, enName: `Accounting Org ${label}` },
    relations: {
      creator: {
        _ids: new ObjectId(creatorId),
        relatedRelations: { createdOrganizations: true },
      },
    },
    projection: { _id: 1 },
  });

  return idOf(created);
};

const createUnit = async (
  organizationId: string,
  label: string,
  type = "Finance",
): Promise<string> => {
  const created = await unit.insertOne({
    doc: { name: `Accounting Unit ${label}`, type, isActive: true },
    relations: {
      organization: {
        _ids: new ObjectId(organizationId),
        relatedRelations: { units: true },
      },
    },
    projection: { _id: 1 },
  });

  return idOf(created);
};

const linesOf = async (entryId: string): Promise<Doc[]> =>
  await journalEntryLine.find({
    filters: { "journalEntry._id": new ObjectId(entryId) },
    projection: {
      lineNumber: 1,
      debit: 1,
      credit: 1,
      account: { _id: 1, systemKey: 1, code: 1, accountType: 1 },
    },
  }).toArray();

const systemKeyOf = (line: Doc): string =>
  String((line.account as Doc | undefined)?.systemKey ?? "");

const dropTestDatabase = async (): Promise<void> => {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  await client.db(DB_NAME).dropDatabase();
  await client.close();
};

Deno.test("accounting engine (integration)", async (t) => {
  const creatorId = await createUser("main");
  const organizationId = await createOrganization(creatorId, "main");
  const unitId = await createUnit(organizationId, "main");
  const entryDate = new Date("2024-01-15T10:00:00.000Z");

  try {
    await t.step(
      "seeds the default chart of accounts idempotently",
      async () => {
        await ensureDefaultChartOfAccounts(organizationId);
        await ensureDefaultChartOfAccounts(organizationId);

        const accounts = await account.find({
          filters: { "organization._id": new ObjectId(organizationId) },
          projection: { _id: 1, code: 1, systemKey: 1, isPostable: 1 },
        }).toArray();

        assertEquals(accounts.length, DEFAULT_CHART_OF_ACCOUNTS.length);

        const codes = accounts.map((item) => String(item.code));
        assertEquals(new Set(codes).size, codes.length);

        for (const definition of DEFAULT_CHART_OF_ACCOUNTS) {
          assert(
            codes.includes(definition.code),
            `missing seeded account ${definition.code}`,
          );
        }
      },
    );

    await t.step("auto-creates the monthly accounting period", async () => {
      const period = await ensureAccountingPeriod(
        new ObjectId(organizationId),
        entryDate,
      );

      assertEquals(period.code, "2024-01");
      assertEquals(period.status, "open");
    });

    await t.step("posts a balanced journal entry and its lines", async () => {
      const result = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "post-1",
        description: "Capital injection",
        lines: [
          { systemKey: "cash", debit: 1000, description: "Cash in" },
          { systemKey: "revenue", credit: 1000, description: "Revenue" },
        ],
      });

      assert(result.created);

      const entry = await journalEntry.findOne({
        filters: { _id: new ObjectId(result.entryId) },
        projection: {
          _id: 1,
          status: 1,
          totalDebit: 1,
          totalCredit: 1,
          isBalanced: 1,
          idempotencyKey: 1,
        },
      });

      assertEquals(entry?.status, "posted");
      assertEquals(entry?.totalDebit, 1000);
      assertEquals(entry?.totalCredit, 1000);
      assertEquals(entry?.isBalanced, true);
      assertEquals(entry?.idempotencyKey, "manual:post-1:posted");

      const lines = await linesOf(result.entryId);
      assertEquals(lines.length, 2);
      assertEquals(lines.filter((line) => Number(line.debit) > 0).length, 1);
      assertEquals(lines.filter((line) => Number(line.credit) > 0).length, 1);
    });

    await t.step("is idempotent on retry", async () => {
      const retry = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "post-1",
        lines: [
          { systemKey: "cash", debit: 1000 },
          { systemKey: "revenue", credit: 1000 },
        ],
      });

      assertEquals(retry.created, false);

      const count = await journalEntry.countDocument({
        filter: { idempotencyKey: "manual:post-1:posted" },
      });
      assertEquals(count, 1);

      const lines = await linesOf(retry.entryId);
      assertEquals(lines.length, 2);
    });

    await t.step("repairs a missing line on retry", async () => {
      const first = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "repair-1",
        lines: [
          { systemKey: "cash", debit: 200 },
          { systemKey: "revenue", credit: 200 },
        ],
      });

      const lines = await linesOf(first.entryId);
      assertEquals(lines.length, 2);

      await journalEntryLine.deleteOne({
        filter: { _id: new ObjectId(String(lines[0]._id)) },
      });

      const afterDelete = await linesOf(first.entryId);
      assertEquals(afterDelete.length, 1);

      const repaired = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "repair-1",
        lines: [
          { systemKey: "cash", debit: 200 },
          { systemKey: "revenue", credit: 200 },
        ],
      });

      assertEquals(repaired.created, false);
      assertEquals(repaired.entryId, first.entryId);

      const repairedLines = await linesOf(first.entryId);
      assertEquals(repairedLines.length, 2);
    });

    await t.step("rejects unbalanced entries", async () => {
      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate,
            sourceType: "manual",
            sourceId: "unbalanced-1",
            lines: [
              { systemKey: "cash", debit: 100 },
              { systemKey: "revenue", credit: 90 },
            ],
          }),
        Error,
        "not balanced",
      );
    });

    await t.step("rejects lines with both debit and credit", async () => {
      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate,
            sourceType: "manual",
            sourceId: "both-1",
            lines: [
              { systemKey: "cash", debit: 10, credit: 10 },
              { systemKey: "revenue", credit: 10 },
            ],
          }),
        Error,
        "both debit and credit",
      );
    });

    await t.step("rejects empty amounts and header accounts", async () => {
      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate,
            sourceType: "manual",
            sourceId: "empty-1",
            lines: [
              { systemKey: "cash" },
              { systemKey: "revenue", credit: 10 },
            ],
          }),
        Error,
        "no amount",
      );

      const header = await account.findOne({
        filters: {
          "organization._id": new ObjectId(organizationId),
          code: "1000",
        },
        projection: { _id: 1 },
      });

      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate,
            sourceType: "manual",
            sourceId: "header-1",
            lines: [
              { accountId: idOf(header), debit: 10 },
              { systemKey: "revenue", credit: 10 },
            ],
          }),
        Error,
        "header account",
      );
    });

    await t.step("rejects inactive accounts", async () => {
      const cash = await account.findOne({
        filters: {
          "organization._id": new ObjectId(organizationId),
          systemKey: "cash",
        },
        projection: { _id: 1 },
      });

      await account.findOneAndUpdate({
        filter: { _id: new ObjectId(idOf(cash)) },
        update: { $set: { isActive: false } },
        projection: { _id: 1 },
      });

      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate,
            sourceType: "manual",
            sourceId: "inactive-1",
            lines: [
              { accountId: idOf(cash), debit: 10 },
              { systemKey: "revenue", credit: 10 },
            ],
          }),
        Error,
        "inactive",
      );

      await account.findOneAndUpdate({
        filter: { _id: new ObjectId(idOf(cash)) },
        update: { $set: { isActive: true } },
        projection: { _id: 1 },
      });
    });

    await t.step("blocks posting into a closed period", async () => {
      const closedDate = new Date("2023-06-15T00:00:00.000Z");
      const period = await ensureAccountingPeriod(
        new ObjectId(organizationId),
        closedDate,
      );

      await accountingPeriod.findOneAndUpdate({
        filter: { _id: new ObjectId(idOf(period)) },
        update: { $set: { status: "closed" } },
        projection: { _id: 1 },
      });

      await assertRejects(
        async () =>
          await postJournalEntry({
            organizationId,
            entryDate: closedDate,
            sourceType: "manual",
            sourceId: "closed-1",
            lines: [
              { systemKey: "cash", debit: 10 },
              { systemKey: "revenue", credit: 10 },
            ],
          }),
        Error,
        "is closed",
      );
    });

    await t.step("auto-creates one cost center per unit", async () => {
      const first = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "costcenter-1",
        lines: [
          { systemKey: "operatingExpense", debit: 40, unitId },
          { systemKey: "cash", credit: 40, unitId },
        ],
      });

      const second = await postJournalEntry({
        organizationId,
        entryDate,
        sourceType: "manual",
        sourceId: "costcenter-2",
        lines: [
          { systemKey: "operatingExpense", debit: 60, unitId },
          { systemKey: "cash", credit: 60, unitId },
        ],
      });

      const costCenters = await costCenter.find({
        filters: {
          "organization._id": new ObjectId(organizationId),
          "unit._id": new ObjectId(unitId),
        },
        projection: { _id: 1, code: 1 },
      }).toArray();

      assertEquals(costCenters.length, 1);
      assertEquals(costCenters[0].code, `CC-${unitId}`);

      const firstLines = await linesOf(first.entryId);
      const secondLines = await linesOf(second.entryId);
      assert(firstLines.length === 2);
      assert(secondLines.length === 2);
    });

    await t.step("posts goods receipt accounting", async () => {
      const result = await recordGoodsReceiptAccounting({
        organizationId,
        receiptId: "receipt-1",
        receiptNumber: "GR-1",
        entryDate,
        amount: 150.5,
        receivingUnitId: unitId,
      });

      assert(result);

      const lines = await linesOf(result!.entryId);
      const debit = lines.find((line) => Number(line.debit) > 0);
      const credit = lines.find((line) => Number(line.credit) > 0);

      assertEquals(systemKeyOf(debit!), "inventory");
      assertEquals(debit?.debit, 150.5);
      assertEquals(systemKeyOf(credit!), "accountsPayable");
      assertEquals(credit?.credit, 150.5);
    });

    await t.step("posts consumption accounting", async () => {
      const result = await recordConsumptionAccounting({
        organizationId,
        consumptionId: "consumption-1",
        entryDate,
        amount: 30,
        unitId,
      });

      assert(result);

      const lines = await linesOf(result!.entryId);
      const debit = lines.find((line) => Number(line.debit) > 0);
      const credit = lines.find((line) => Number(line.credit) > 0);

      assertEquals(systemKeyOf(debit!), "cogs");
      assertEquals(debit?.debit, 30);
      assertEquals(systemKeyOf(credit!), "inventory");
      assertEquals(credit?.credit, 30);
    });

    await t.step("posts payment accounting", async () => {
      const result = await recordPaymentAccounting({
        organizationId,
        paymentOrderId: "payment-1",
        entryDate,
        amount: 100,
        financialUnitId: unitId,
      });

      assert(result);

      const lines = await linesOf(result!.entryId);
      const debit = lines.find((line) => Number(line.debit) > 0);
      const credit = lines.find((line) => Number(line.credit) > 0);

      assertEquals(systemKeyOf(debit!), "accountsPayable");
      assertEquals(debit?.debit, 100);
      assertEquals(systemKeyOf(credit!), "bank");
      assertEquals(credit?.credit, 100);
    });

    await t.step("keeps organizations isolated", async () => {
      const otherCreator = await createUser("other");
      const otherOrganization = await createOrganization(
        otherCreator,
        "other",
      );
      await ensureDefaultChartOfAccounts(otherOrganization);

      const otherAccounts = await account.countDocument({
        filter: { "organization._id": new ObjectId(otherOrganization) },
      });
      const mainAccounts = await account.countDocument({
        filter: { "organization._id": new ObjectId(organizationId) },
      });

      assertEquals(otherAccounts, DEFAULT_CHART_OF_ACCOUNTS.length);
      assertEquals(mainAccounts, DEFAULT_CHART_OF_ACCOUNTS.length);

      await postJournalEntry({
        organizationId: otherOrganization,
        entryDate,
        sourceType: "manual",
        sourceId: "other-1",
        lines: [
          { systemKey: "cash", debit: 5 },
          { systemKey: "revenue", credit: 5 },
        ],
      });

      const otherEntries = await journalEntry.countDocument({
        filter: { "organization._id": new ObjectId(otherOrganization) },
      });
      assertEquals(otherEntries, 1);

      const mainEntries = await journalEntry.countDocument({
        filter: {
          "organization._id": new ObjectId(organizationId),
          sourceType: "manual",
          sourceId: "post-1",
        },
      });
      assertEquals(mainEntries, 1);
    });
  } finally {
    await dropTestDatabase();
  }
});
