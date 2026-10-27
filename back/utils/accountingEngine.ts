/**
 * Accounting Engine — event-driven double-entry posting.
 *
 * Responsibilities:
 *  - Seed the default Chart of Accounts per organization on demand.
 *  - Auto-create monthly AccountingPeriods and block posting into closed ones.
 *  - Auto-create CostCenters for organizational units.
 *  - Post balanced JournalEntry + JournalEntryLine documents idempotently.
 *
 * Idempotency: `JournalEntry.idempotencyKey` has a unique index. On retry the
 * engine returns the existing header and repairs any missing lines from the
 * immutable `lineSnapshot`. Lesan 0.2.3 does not expose MongoDB sessions for
 * relation writes, so this snapshot/repair approach is used instead of a
 * multi-collection transaction.
 */
import { type Document, ObjectId } from "lesan";
import {
  account,
  accountingPeriod,
  costCenter,
  journalEntry,
  journalEntryLine,
  unit,
} from "../mod.ts";
import { throwError } from "./throwError.ts";
import {
  accountingPeriodBoundsFor,
  buildEntryNumber,
  buildIdempotencyKey,
  roundMoney,
} from "./accountingMath.ts";
import type { account_system_key_array } from "../models/account.ts";
import type { journalEntry_source_type_array } from "../models/journalEntry.ts";

export type AccountSystemKey = typeof account_system_key_array[number];
export type JournalSourceType = typeof journalEntry_source_type_array[number];

export type JournalLineInput = {
  accountId?: string;
  systemKey?: AccountSystemKey;
  description?: string;
  debit?: number;
  credit?: number;
  costCenterId?: string;
  unitId?: string;
  storeId?: string;
};

export type PostJournalEntryInput = {
  organizationId: string;
  entryDate?: Date;
  description?: string;
  reference?: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  sourceEvent?: string;
  idempotencyKey?: string;
  createdBy?: string;
  lines: JournalLineInput[];
};

export type NormalizedJournalLine = {
  lineNumber: number;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: string;
  description?: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterName?: string;
  unitId?: string;
  storeId?: string;
};

type DefaultAccount = {
  code: string;
  name: string;
  enName: string;
  accountType: string;
  normalBalance: "debit" | "credit";
  systemKey?: AccountSystemKey;
  isPostable: boolean;
  parentCode?: string;
};

export const DEFAULT_CHART_OF_ACCOUNTS: DefaultAccount[] = [
  {
    code: "1000",
    name: "Assets",
    enName: "Assets",
    accountType: "asset",
    normalBalance: "debit",
    isPostable: false,
  },
  {
    code: "1100",
    name: "Current Assets",
    enName: "Current Assets",
    accountType: "asset",
    normalBalance: "debit",
    isPostable: false,
    parentCode: "1000",
  },
  {
    code: "1010",
    name: "Cash on Hand",
    enName: "Cash on Hand",
    accountType: "asset",
    normalBalance: "debit",
    systemKey: "cash",
    isPostable: true,
    parentCode: "1100",
  },
  {
    code: "1020",
    name: "Bank Accounts",
    enName: "Bank Accounts",
    accountType: "asset",
    normalBalance: "debit",
    systemKey: "bank",
    isPostable: true,
    parentCode: "1100",
  },
  {
    code: "1200",
    name: "Inventory",
    enName: "Inventory",
    accountType: "asset",
    normalBalance: "debit",
    systemKey: "inventory",
    isPostable: true,
    parentCode: "1100",
  },
  {
    code: "1300",
    name: "Accounts Receivable",
    enName: "Accounts Receivable",
    accountType: "asset",
    normalBalance: "debit",
    systemKey: "accountsReceivable",
    isPostable: true,
    parentCode: "1100",
  },
  {
    code: "2000",
    name: "Liabilities",
    enName: "Liabilities",
    accountType: "liability",
    normalBalance: "credit",
    isPostable: false,
  },
  {
    code: "2100",
    name: "Accounts Payable",
    enName: "Accounts Payable",
    accountType: "liability",
    normalBalance: "credit",
    systemKey: "accountsPayable",
    isPostable: true,
    parentCode: "2000",
  },
  {
    code: "2200",
    name: "Goods Received Not Invoiced",
    enName: "Goods Received Not Invoiced",
    accountType: "liability",
    normalBalance: "credit",
    systemKey: "grni",
    isPostable: true,
    parentCode: "2000",
  },
  {
    code: "3000",
    name: "Equity",
    enName: "Equity",
    accountType: "equity",
    normalBalance: "credit",
    isPostable: false,
  },
  {
    code: "3100",
    name: "Retained Earnings",
    enName: "Retained Earnings",
    accountType: "equity",
    normalBalance: "credit",
    systemKey: "retainedEarnings",
    isPostable: true,
    parentCode: "3000",
  },
  {
    code: "4000",
    name: "Revenue",
    enName: "Revenue",
    accountType: "revenue",
    normalBalance: "credit",
    systemKey: "revenue",
    isPostable: true,
  },
  {
    code: "5000",
    name: "Expenses",
    enName: "Expenses",
    accountType: "expense",
    normalBalance: "debit",
    isPostable: false,
  },
  {
    code: "5100",
    name: "Cost of Goods Sold",
    enName: "Cost of Goods Sold",
    accountType: "expense",
    normalBalance: "debit",
    systemKey: "cogs",
    isPostable: true,
    parentCode: "5000",
  },
  {
    code: "5200",
    name: "Inventory Adjustment",
    enName: "Inventory Adjustment",
    accountType: "expense",
    normalBalance: "debit",
    systemKey: "inventoryAdjustment",
    isPostable: true,
    parentCode: "5000",
  },
  {
    code: "5300",
    name: "Operating Expenses",
    enName: "Operating Expenses",
    accountType: "expense",
    normalBalance: "debit",
    systemKey: "operatingExpense",
    isPostable: true,
    parentCode: "5000",
  },
];

const toObjectId = (value: unknown): ObjectId | null => {
  if (value === null || value === undefined || value === "") return null;

  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

const money = roundMoney;

const relationId = (
  doc: Document | null | undefined,
  field: string,
): string | null => {
  const relation = doc?.[field] as { _id?: unknown } | null | undefined;
  const id = relation?._id;

  return id === null || id === undefined ? null : String(id);
};

const entryNumberFor = (entryDate: Date): string =>
  buildEntryNumber(entryDate, Math.random().toString(36).slice(2, 8));

const accountByCode = async (organizationId: ObjectId, code: string) => {
  return await account.findOne({
    filters: { "organization._id": organizationId, code },
    projection: {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      isPostable: 1,
    },
  }) as Document | null;
};

export const ensureDefaultChartOfAccounts = async (
  organizationId: string,
): Promise<void> => {
  const organizationObjectId = toObjectId(organizationId);
  if (!organizationObjectId) {
    throwError("Invalid organization id for chart of accounts");
    return;
  }

  const existingAccounts = await account.find({
    filters: { "organization._id": organizationObjectId },
    projection: { _id: 1, code: 1 },
  }).toArray();

  const byCode = new Map<string, ObjectId>();
  for (const existing of existingAccounts) {
    byCode.set(String(existing.code), existing._id as ObjectId);
  }

  for (const definition of DEFAULT_CHART_OF_ACCOUNTS) {
    let currentId = byCode.get(definition.code);

    if (!currentId) {
      const relations: Record<string, unknown> = {
        organization: {
          _ids: organizationObjectId,
          relatedRelations: { accounts: true },
        },
      };

      if (definition.parentCode) {
        let parentId = byCode.get(definition.parentCode);

        if (!parentId) {
          const parentDoc = await accountByCode(
            organizationObjectId,
            definition.parentCode,
          );
          parentId = parentDoc?._id as ObjectId | undefined;
        }

        if (parentId) {
          relations.parentAccount = {
            _ids: parentId,
            relatedRelations: { childAccounts: true },
          };
        }
      }

      try {
        const created = await account.insertOne({
          doc: {
            code: definition.code,
            name: definition.name,
            enName: definition.enName,
            accountType: definition.accountType as
              | "asset"
              | "liability"
              | "equity"
              | "revenue"
              | "expense",
            normalBalance: definition.normalBalance,
            ...(definition.systemKey && { systemKey: definition.systemKey }),
            level: definition.parentCode ? 2 : 1,
            isPostable: definition.isPostable,
            isActive: true,
            isSystem: true,
          },
          relations,
          projection: { _id: 1 },
        });

        currentId = created?._id as ObjectId;
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;

        const raced = await accountByCode(
          organizationObjectId,
          definition.code,
        );
        currentId = raced?._id as ObjectId;
      }
    }

    if (currentId) byCode.set(definition.code, currentId);
  }
};

const resolveAccountById = async (
  organizationId: ObjectId,
  accountId: string,
): Promise<Document> => {
  const accountObjectId = toObjectId(accountId);
  if (!accountObjectId) throwError("Invalid account id");

  const found = await account.findOne({
    filters: {
      _id: accountObjectId as ObjectId,
      "organization._id": organizationId,
    },
    projection: {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      isPostable: 1,
      isActive: 1,
    },
  }) as Document | null;

  if (!found) throwError("Account not found in this organization");
  const doc = found as Document;
  if (doc.isActive === false) throwError("Account is inactive");
  if (doc.isPostable === false) {
    throwError("Account is a header account and cannot be posted to");
  }

  return doc;
};

const resolveSystemAccount = async (
  organizationId: ObjectId,
  systemKey: AccountSystemKey,
): Promise<Document> => {
  await ensureDefaultChartOfAccounts(String(organizationId));

  const found = await account.findOne({
    filters: {
      "organization._id": organizationId,
      systemKey,
      isActive: true,
    },
    projection: {
      _id: 1,
      code: 1,
      name: 1,
      accountType: 1,
      normalBalance: 1,
      isPostable: 1,
    },
  }) as Document | null;

  if (!found) throwError(`No active account mapped for ${systemKey}`);

  return found!;
};

const ensureCostCenterForUnit = async (
  organizationId: ObjectId,
  unitId: string,
): Promise<Document | null> => {
  const unitObjectId = toObjectId(unitId);
  if (!unitObjectId) return null;

  const unitDoc = await unit.findOne({
    filters: { _id: unitObjectId },
    projection: { _id: 1, name: 1, organization: { _id: 1 } },
  }) as Document | null;

  if (!unitDoc) return null;

  const unitOrganizationId = relationId(unitDoc, "organization");
  if (!unitOrganizationId || unitOrganizationId !== String(organizationId)) {
    return null;
  }

  const existing = await costCenter.findOne({
    filters: { "unit._id": unitObjectId, "organization._id": organizationId },
    projection: { _id: 1, code: 1, name: 1 },
  }) as Document | null;

  if (existing) return existing;

  try {
    const created = await costCenter.insertOne({
      doc: {
        code: `CC-${String(unitObjectId)}`,
        name: String(unitDoc.name || "Unit Cost Center"),
        type: "cost",
        isActive: true,
      },
      relations: {
        organization: {
          _ids: organizationId,
          relatedRelations: { costCenters: true },
        },
        unit: {
          _ids: unitObjectId,
          relatedRelations: { costCenters: true },
        },
      },
      projection: { _id: 1, code: 1, name: 1 },
    });

    return created as Document;
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;

    return await costCenter.findOne({
      filters: { "unit._id": unitObjectId, "organization._id": organizationId },
      projection: { _id: 1, code: 1, name: 1 },
    }) as Document | null;
  }
};

const resolveCostCenter = async (
  organizationId: ObjectId,
  input: JournalLineInput,
): Promise<Document | null> => {
  if (input.costCenterId) {
    const costCenterObjectId = toObjectId(input.costCenterId);
    if (!costCenterObjectId) throwError("Invalid cost center id");

    const found = await costCenter.findOne({
      filters: {
        _id: costCenterObjectId as ObjectId,
        "organization._id": organizationId,
      },
      projection: { _id: 1, code: 1, name: 1 },
    }) as Document | null;

    if (!found) throwError("Cost center not found in this organization");

    return found;
  }

  if (input.unitId) {
    return await ensureCostCenterForUnit(organizationId, input.unitId);
  }

  return null;
};

export const ensureAccountingPeriod = async (
  organizationId: ObjectId,
  entryDate: Date,
): Promise<Document> => {
  const existing = await accountingPeriod.findOne({
    filters: {
      "organization._id": organizationId,
      startDate: { $lte: entryDate },
      endDate: { $gte: entryDate },
    },
    projection: { _id: 1, code: 1, status: 1, startDate: 1, endDate: 1 },
  }) as Document | null;

  if (existing) {
    if (existing.status !== "open") {
      throwError(`Accounting period ${existing.code} is ${existing.status}`);
    }

    return existing;
  }

  const {
    code,
    name,
    startDate,
    endDate,
  } = accountingPeriodBoundsFor(entryDate);

  try {
    const created = await accountingPeriod.insertOne({
      doc: {
        code,
        name,
        startDate,
        endDate,
        status: "open",
      },
      relations: {
        organization: {
          _ids: organizationId,
          relatedRelations: { accountingPeriods: true },
        },
      },
      projection: { _id: 1, code: 1, status: 1, startDate: 1, endDate: 1 },
    });

    return created as Document;
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;

    const raced = await accountingPeriod.findOne({
      filters: { "organization._id": organizationId, code },
      projection: { _id: 1, code: 1, status: 1, startDate: 1, endDate: 1 },
    }) as Document | null;

    if (!raced) throwError("Failed to create accounting period");
    if (raced!.status !== "open") {
      throwError(`Accounting period ${raced!.code} is ${raced!.status}`);
    }

    return raced!;
  }
};

const normalizeLines = async (
  organizationId: ObjectId,
  lines: JournalLineInput[],
): Promise<NormalizedJournalLine[]> => {
  const normalized: NormalizedJournalLine[] = [];

  for (let index = 0; index < lines.length; index++) {
    const input = lines[index];
    const debit = money(Math.max(0, Number(input.debit) || 0));
    const credit = money(Math.max(0, Number(input.credit) || 0));

    if (debit === 0 && credit === 0) {
      throwError(`Journal line ${index + 1} has no amount`);
    }

    if (debit > 0 && credit > 0) {
      throwError(`Journal line ${index + 1} cannot have both debit and credit`);
    }

    const accountDoc = input.accountId
      ? await resolveAccountById(organizationId, input.accountId)
      : input.systemKey
      ? await resolveSystemAccount(organizationId, input.systemKey)
      : throwError(`Journal line ${index + 1} has no account mapping`);

    const costCenterDoc = await resolveCostCenter(organizationId, input);

    normalized.push({
      lineNumber: index + 1,
      accountId: String(accountDoc!._id),
      accountCode: String(accountDoc!.code ?? ""),
      accountName: String(accountDoc!.name ?? ""),
      accountType: String(accountDoc!.accountType ?? ""),
      normalBalance: String(accountDoc!.normalBalance ?? ""),
      ...(input.description && { description: input.description }),
      debit,
      credit,
      ...(costCenterDoc && {
        costCenterId: String(costCenterDoc._id),
        costCenterName: String(costCenterDoc.name ?? ""),
      }),
      ...(input.unitId && { unitId: input.unitId }),
      ...(input.storeId && { storeId: input.storeId }),
    });
  }

  const totalDebit = money(
    normalized.reduce((sum, line) => sum + line.debit, 0),
  );
  const totalCredit = money(
    normalized.reduce((sum, line) => sum + line.credit, 0),
  );

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throwError(
      `Journal entry is not balanced: debit ${totalDebit} != credit ${totalCredit}`,
    );
  }

  return normalized;
};

const insertLine = async (
  entryId: ObjectId,
  organizationId: ObjectId,
  periodId: ObjectId,
  line: NormalizedJournalLine,
): Promise<void> => {
  const relations: Record<string, unknown> = {
    journalEntry: {
      _ids: entryId,
      relatedRelations: { lines: true },
    },
    account: {
      _ids: new ObjectId(line.accountId),
      relatedRelations: { journalEntryLines: true },
    },
    organization: {
      _ids: organizationId,
      relatedRelations: { journalEntryLines: true },
    },
    period: {
      _ids: periodId,
      relatedRelations: { journalEntryLines: true },
    },
  };

  if (line.costCenterId) {
    relations.costCenter = {
      _ids: new ObjectId(line.costCenterId),
      relatedRelations: { journalEntryLines: true },
    };
  }

  if (line.storeId) {
    relations.store = {
      _ids: new ObjectId(line.storeId),
      relatedRelations: { journalEntryLines: true },
    };
  }

  await journalEntryLine.insertOne({
    doc: {
      lineNumber: line.lineNumber,
      ...(line.description && { description: line.description }),
      debit: line.debit,
      credit: line.credit,
    },
    relations,
    projection: { _id: 1 },
  });
};

const repairJournalEntry = async (entry: Document): Promise<void> => {
  const entryId = entry._id as ObjectId;
  const organizationId = toObjectId(relationId(entry, "organization"));
  const periodId = toObjectId(relationId(entry, "period"));
  const snapshot = (entry.lineSnapshot ?? []) as NormalizedJournalLine[];

  if (!organizationId || !periodId || snapshot.length === 0) return;

  const existingLines = await journalEntryLine.find({
    filters: { "journalEntry._id": entryId },
    projection: { lineNumber: 1 },
  }).toArray();

  const existingLineNumbers = new Set(
    existingLines.map((line) => Number(line.lineNumber)),
  );

  for (const line of snapshot) {
    if (existingLineNumbers.has(Number(line.lineNumber))) continue;

    await insertLine(entryId, organizationId, periodId, line);
  }

  if (entry.status !== "posted") {
    await journalEntry.findOneAndUpdate({
      filter: { _id: entryId },
      update: {
        $set: {
          status: "posted",
          isBalanced: true,
          postedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      projection: { _id: 1 },
    });
  }
};

const findEntryByIdempotencyKey = async (key: string) =>
  await journalEntry.findOne({
    filters: { idempotencyKey: key },
    projection: {
      _id: 1,
      entryNumber: 1,
      status: 1,
      lineSnapshot: 1,
      organization: { _id: 1 },
      period: { _id: 1 },
    },
  }) as Document | null;

export const postJournalEntry = async (
  input: PostJournalEntryInput,
): Promise<{ entryId: string; entryNumber: string; created: boolean }> => {
  const organizationId = toObjectId(input.organizationId);
  if (!organizationId) throwError("Invalid organization id for journal entry");

  const entryDate = input.entryDate && !isNaN(input.entryDate.getTime())
    ? input.entryDate
    : new Date();

  const idempotencyKey = buildIdempotencyKey({
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    sourceEvent: input.sourceEvent,
    explicitKey: input.idempotencyKey,
  });

  const existing = await findEntryByIdempotencyKey(idempotencyKey);

  if (existing) {
    await repairJournalEntry(existing);

    return {
      entryId: String(existing._id),
      entryNumber: String(existing.entryNumber),
      created: false,
    };
  }

  if (!input.lines || input.lines.length === 0) {
    throwError("A journal entry requires at least one line");
  }

  const normalized = await normalizeLines(organizationId!, input.lines);
  const period = await ensureAccountingPeriod(organizationId!, entryDate);
  const periodId = period._id as ObjectId;

  const totalDebit = money(
    normalized.reduce((sum, line) => sum + line.debit, 0),
  );
  const totalCredit = money(
    normalized.reduce((sum, line) => sum + line.credit, 0),
  );

  const relations: Record<string, unknown> = {
    organization: {
      _ids: organizationId,
      relatedRelations: { journalEntries: true },
    },
    period: {
      _ids: periodId,
      relatedRelations: { journalEntries: true },
    },
  };

  if (input.createdBy) {
    const createdById = toObjectId(input.createdBy);
    if (createdById) {
      relations.createdBy = {
        _ids: createdById,
        relatedRelations: { journalEntries: true },
      };
    }
  }

  const entryNumber = entryNumberFor(entryDate);
  let created: Document | null = null;

  try {
    created = await journalEntry.insertOne({
      doc: {
        entryNumber,
        entryDate,
        ...(input.description && { description: input.description }),
        ...(input.reference && { reference: input.reference }),
        sourceType: input.sourceType,
        ...(input.sourceId && { sourceId: input.sourceId }),
        ...(input.sourceEvent && { sourceEvent: input.sourceEvent }),
        status: "posted",
        totalDebit,
        totalCredit,
        isBalanced: true,
        idempotencyKey,
        postedAt: new Date(),
        lineSnapshot: normalized,
      },
      relations,
      projection: { _id: 1, entryNumber: 1 },
    }) as Document;
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;

    const raced = await findEntryByIdempotencyKey(idempotencyKey);
    if (!raced) throw error;

    await repairJournalEntry(raced);

    return {
      entryId: String(raced._id),
      entryNumber: String(raced.entryNumber),
      created: false,
    };
  }

  const entryId = created!._id as ObjectId;

  try {
    for (const line of normalized) {
      await insertLine(entryId, organizationId!, periodId, line);
    }
  } catch (error) {
    await journalEntry.findOneAndUpdate({
      filter: { _id: entryId },
      update: {
        $set: {
          status: "draft",
          isBalanced: false,
          updatedAt: new Date(),
        },
      },
      projection: { _id: 1 },
    });

    throw error;
  }

  return {
    entryId: String(entryId),
    entryNumber: String(created!.entryNumber ?? entryNumber),
    created: true,
  };
};

export type GoodsReceiptAccountingInput = {
  organizationId: string;
  receiptId: string;
  receiptNumber?: string;
  entryDate?: Date;
  amount: number;
  storeId?: string;
  receivingUnitId?: string;
  createdBy?: string;
  description?: string;
};

export const recordGoodsReceiptAccounting = async (
  input: GoodsReceiptAccountingInput,
): Promise<
  { entryId: string; entryNumber: string; created: boolean } | null
> => {
  const amount = money(Number(input.amount) || 0);
  if (amount <= 0) return null;

  return await postJournalEntry({
    organizationId: input.organizationId,
    entryDate: input.entryDate,
    description: input.description ??
      `Goods received ${input.receiptNumber ?? input.receiptId}`,
    reference: input.receiptNumber ?? input.receiptId,
    sourceType: "goodsReceipt",
    sourceId: input.receiptId,
    sourceEvent: "receipt",
    createdBy: input.createdBy,
    lines: [
      {
        systemKey: "inventory",
        debit: amount,
        description: input.description,
        unitId: input.receivingUnitId,
      },
      {
        systemKey: "accountsPayable",
        credit: amount,
        description: input.description,
        unitId: input.receivingUnitId,
        storeId: input.storeId,
      },
    ],
  });
};

export type ConsumptionAccountingInput = {
  organizationId: string;
  consumptionId: string;
  entryDate?: Date;
  amount: number;
  unitId: string;
  createdBy?: string;
  description?: string;
};

export const recordConsumptionAccounting = async (
  input: ConsumptionAccountingInput,
): Promise<
  { entryId: string; entryNumber: string; created: boolean } | null
> => {
  const amount = money(Number(input.amount) || 0);
  if (amount <= 0) return null;

  return await postJournalEntry({
    organizationId: input.organizationId,
    entryDate: input.entryDate,
    description: input.description ??
      `Inventory consumption ${input.consumptionId}`,
    reference: input.consumptionId,
    sourceType: "consumption",
    sourceId: input.consumptionId,
    sourceEvent: "consumption",
    createdBy: input.createdBy,
    lines: [
      {
        systemKey: "cogs",
        debit: amount,
        description: input.description,
        unitId: input.unitId,
      },
      {
        systemKey: "inventory",
        credit: amount,
        description: input.description,
        unitId: input.unitId,
      },
    ],
  });
};

export type PaymentAccountingInput = {
  organizationId: string;
  paymentOrderId: string;
  entryDate?: Date;
  amount: number;
  storeId?: string;
  financialUnitId?: string;
  createdBy?: string;
  description?: string;
};

export const recordPaymentAccounting = async (
  input: PaymentAccountingInput,
): Promise<
  { entryId: string; entryNumber: string; created: boolean } | null
> => {
  const amount = money(Number(input.amount) || 0);
  if (amount <= 0) return null;

  return await postJournalEntry({
    organizationId: input.organizationId,
    entryDate: input.entryDate,
    description: input.description ?? `Payment order ${input.paymentOrderId}`,
    reference: input.paymentOrderId,
    sourceType: "paymentOrder",
    sourceId: input.paymentOrderId,
    sourceEvent: "payment",
    createdBy: input.createdBy,
    lines: [
      {
        systemKey: "accountsPayable",
        debit: amount,
        description: input.description,
        unitId: input.financialUnitId,
        storeId: input.storeId,
      },
      {
        systemKey: "bank",
        credit: amount,
        description: input.description,
        unitId: input.financialUnitId,
      },
    ],
  });
};
