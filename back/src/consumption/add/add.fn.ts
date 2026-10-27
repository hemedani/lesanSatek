import { type ActFn, type Document, ObjectId } from "lesan";
import {
  consumption,
  coreApp,
  inventory,
  purchasingRequest,
  unit,
  ware,
} from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { removeStock } from "../../../utils/inventoryManager.ts";
import { recordConsumptionAccounting } from "../../../utils/accountingEngine.ts";
import { throwError } from "../../../utils/throwError.ts";
import { assertUnitInActorScope } from "../../../utils/unitScope.ts";
import { loadPurchasingRequestForActor } from "../../purchasingRequest/readScope.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

type UnitDoc = {
  _id?: unknown;
  name?: unknown;
  organization?: { _id?: unknown } | null;
};

type InventoryDoc = {
  _id?: unknown;
  unit?: { _id?: unknown } | null;
};

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const {
    activeRoleId,
    unitId: rawUnitId,
    consumedById: rawConsumedById,
    inventoryId,
    purchasingRequestId,
    wareId,
    ...rest
  } = set;

  const activeRole = (user.roles || []).find((r: { roleId: string }) =>
    r.roleId === activeRoleId
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const unitId = rawUnitId ||
    (activeRole.scopeType === "unit" ? activeRole.scopeId : undefined);

  if (!unitId) {
    throwError("unitId is required and cannot be derived from active role");
    return;
  }

  await assertUnitInActorScope(user, activeRole, unitId);

  const consumedById = isScopeBypass(activeRole, user)
    ? (rawConsumedById || user._id)
    : user._id;

  // Fetch ware to derive hierarchy
  const wareDoc = await ware.findOne({
    filters: { _id: new ObjectId(wareId as string) },
    projection: {
      _id: 1,
      name: 1,
      price: 1,
      "wareModel._id": 1,
      "wareGroup._id": 1,
      "wareClass._id": 1,
      "wareType._id": 1,
    },
  }) as Document;

  if (!wareDoc) {
    throwError("Ware not found");
    return;
  }

  await assertWareModelAccess(user, activeRole, {
    _id: (wareDoc.wareModel as Record<string, unknown>)?._id,
    wareType: wareDoc.wareType as { _id?: unknown },
    wareClass: wareDoc.wareClass as { _id?: unknown },
    wareGroup: wareDoc.wareGroup as { _id?: unknown },
  });

  if (inventoryId) {
    const inventoryDoc = await inventory.findOne({
      filters: { _id: new ObjectId(inventoryId as string) },
      projection: { _id: 1, unit: { _id: 1 } },
    }) as InventoryDoc | null;

    if (
      !inventoryDoc ||
      normalizeId(inventoryDoc.unit?._id) !== normalizeId(unitId)
    ) {
      throwError("You cant do this");
      return;
    }
  }

  const accountingUnitDoc = await unit.findOne({
    filters: { _id: new ObjectId(unitId as string) },
    projection: { _id: 1, name: 1, organization: { _id: 1 } },
  }) as UnitDoc | null;

  const accountingOrganizationId = normalizeId(
    accountingUnitDoc?.organization?._id,
  );
  const wareName = String(
    (wareDoc as Record<string, unknown>).name ?? "",
  );
  const quantity = Number(rest.quantity) || 0;
  const resolvedUnitCost = rest.unitCost !== undefined
    ? Number(rest.unitCost)
    : (Number((wareDoc as Record<string, unknown>).price) || 0);
  const totalCost = Math.round(resolvedUnitCost * quantity * 100) / 100;

  rest.unitCost = resolvedUnitCost;
  rest.totalCost = totalCost;

  if (purchasingRequestId) {
    const pr = await loadPurchasingRequestForActor(
      activeRole,
      user,
      purchasingRequestId,
    );

    const prOrganizationId = normalizeId(pr.organization?._id);
    const prRequestingUnitId = normalizeId(pr.requestingUnit?._id);
    const unitOrganizationId = normalizeId(
      accountingUnitDoc?.organization?._id,
    );
    const normalizedUnitId = normalizeId(unitId);

    const sameOrganization = prOrganizationId !== null &&
      unitOrganizationId !== null &&
      prOrganizationId === unitOrganizationId;
    const sameRequestingUnit = prRequestingUnitId !== null &&
      prRequestingUnitId === normalizedUnitId;

    if (!sameOrganization && !sameRequestingUnit) {
      throwError("You cant do this");
      return;
    }
  }

  const relations: Record<string, unknown> = {};

  relations.unit = {
    _ids: new ObjectId(unitId as string),
    relatedRelations: { consumptions: true },
  };

  relations.consumedBy = {
    _ids: new ObjectId(consumedById as string),
    relatedRelations: { consumptions: true },
  };

  relations.ware = {
    _ids: new ObjectId(wareId as string),
    relatedRelations: { consumptions: true },
  };

  relations.wareModel = {
    _ids: (wareDoc.wareModel as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareGroup = {
    _ids: (wareDoc.wareGroup as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareClass = {
    _ids: (wareDoc.wareClass as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  relations.wareType = {
    _ids: (wareDoc.wareType as Record<string, unknown>)?._id as ObjectId,
    relatedRelations: { consumptions: true },
  };

  if (inventoryId) {
    relations.inventory = {
      _ids: new ObjectId(inventoryId as string),
      relatedRelations: { consumptions: true },
    };
  }

  const result = await consumption.insertOne({
    doc: rest,
    relations,
    projection: get,
  });

  if (!result) {
    throw new Error("Failed to create consumption record");
  }

  // Remove from inventory
  await removeStock(
    unitId as string,
    wareId as string,
    rest.quantity as number,
    (rest.reason as string) || "consumption",
    consumedById as string,
    {
      referenceType: "consumption",
      referenceId: String(result._id),
      ...(inventoryId && { inventoryId: inventoryId as string }),
    },
  );

  // Post the double-entry accounting side-effect (COGS / Inventory).
  if (accountingOrganizationId && totalCost > 0) {
    try {
      await recordConsumptionAccounting({
        organizationId: accountingOrganizationId,
        consumptionId: String(result._id),
        entryDate: (rest.consumedAt as Date) || new Date(),
        amount: totalCost,
        unitId: String(unitId),
        createdBy: String(consumedById),
        description: `Consumption of ${wareName || String(wareId)}`,
      });
    } catch (error) {
      console.error("Failed to post consumption journal entry", error);
    }
  }

  // Push "goods_consumed" history on the purchasing request if linked
  if (purchasingRequestId) {
    const wareDoc2 = wareDoc as Record<string, unknown>;
    const wareModelName =
      ((wareDoc2.wareModel as Record<string, unknown>)?.name as string) || "";

    await purchasingRequest.findOneAndUpdate({
      filter: { _id: new ObjectId(purchasingRequestId as string) },
      update: {
        $push: {
          history: {
            action: "goods_consumed",
            performed: {
              by: consumedById as string,
              name: `${user.first_name} ${user.last_name}`,
              at: new Date(),
              role: {
                id: activeRole.roleId,
                name: activeRole.name,
                scopeType: activeRole.scopeType,
                scopeId: activeRole.scopeId,
              },
            },
            details: {
              consumptionId: result._id?.toString(),
              wareId,
              wareModelName,
              quantity: rest.quantity,
            },
          },
        },
      },
      projection: { _id: 1 },
    });
  }

  return result;
};
