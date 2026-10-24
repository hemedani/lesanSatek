import { type ActFn, type Document, ObjectId } from "lesan";
import { coreApp, inventory, unit } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

type UnitDoc = {
  _id?: unknown;
  organization?: { _id?: unknown } | null;
};

export const transferFn: ActFn = async (body) => {
  const {
    set: { fromUnitId, toUnitId, wareId, quantity, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  const bypass = activeRole !== undefined &&
    isScopeBypass(activeRole, user);

  if (!bypass) {
    if (!activeRole) {
      throwError("Active role not found");
      return;
    }

    const fromUnit = await unit.findOne({
      filters: { _id: new ObjectId(fromUnitId as string) },
      projection: { _id: 1, organization: { _id: 1 } },
    }) as UnitDoc | null;

    const toUnit = await unit.findOne({
      filters: { _id: new ObjectId(toUnitId as string) },
      projection: { _id: 1, organization: { _id: 1 } },
    }) as UnitDoc | null;

    if (!fromUnit || !toUnit) {
      throwError("You cant do this");
      return;
    }

    const from = normalizeId(fromUnitId);
    const to = normalizeId(toUnitId);
    const fromOrganizationId = normalizeId(fromUnit.organization?._id);
    const toOrganizationId = normalizeId(toUnit.organization?._id);

    if (!from || !to) {
      throwError("You cant do this");
      return;
    }

    if (activeRole.name === "OrgHead") {
      const organizationId = activeRole.scopeType === "organization"
        ? normalizeId(activeRole.scopeId)
        : null;

      if (
        !organizationId || fromOrganizationId !== organizationId ||
        toOrganizationId !== organizationId
      ) {
        throwError("You cant do this");
        return;
      }
    } else if (activeRole.name === "UnitHead") {
      const scopeId = activeRole.scopeType === "unit"
        ? normalizeId(activeRole.scopeId)
        : null;

      if (
        !scopeId || from !== scopeId || !fromOrganizationId ||
        toOrganizationId !== fromOrganizationId
      ) {
        throwError("You cant do this");
        return;
      }
    } else if (activeRole.name === "Employee") {
      const scopedUnitId = activeRole.scopeType === "unit"
        ? normalizeId(activeRole.scopeId)
        : null;
      const allowedUnitIds = scopedUnitId
        ? new Set([scopedUnitId])
        : new Set(
          ((user as unknown as { units?: { _id?: unknown }[] }).units ?? [])
            .map((candidate) => normalizeId(candidate._id))
            .filter((id): id is string => id !== null),
        );

      if (
        !allowedUnitIds.has(from) || !allowedUnitIds.has(to) ||
        !fromOrganizationId || toOrganizationId !== fromOrganizationId
      ) {
        throwError("You cant do this");
        return;
      }
    } else {
      throwError("You cant do this");
      return;
    }
  }

  const fromInv = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(fromUnitId as string),
      "ware._id": new ObjectId(wareId as string),
    },
    projection: {
      _id: 1,
      unit: 1,
      quantity: 1,
      wareModel: { _id: 1 },
      wareType: { _id: 1 },
      wareClass: { _id: 1 },
      wareGroup: { _id: 1 },
    } as Document,
  }) as Document;

  if (!fromInv) {
    throw new Error("Source inventory not found");
  }

  if ((fromInv.quantity as number) < (quantity as number)) {
    throw new Error("Insufficient quantity in source inventory");
  }

  if (activeRole && !bypass) {
    await assertWareModelAccess(user, activeRole as ActiveRole, {
      _id: (fromInv.wareModel as Record<string, unknown>)?._id,
      wareType: fromInv.wareType as { _id?: unknown },
      wareClass: fromInv.wareClass as { _id?: unknown },
      wareGroup: fromInv.wareGroup as { _id?: unknown },
    });
  }

  await inventory.findOneAndUpdate({
    filter: { _id: fromInv._id as ObjectId },
    update: {
      $inc: { quantity: -(quantity as number) },
      $set: { updatedAt: new Date() },
    },
    projection: { _id: 1, quantity: 1 },
  });

  const toInv = await inventory.findOne({
    filters: {
      "unit._id": new ObjectId(toUnitId as string),
      "ware._id": new ObjectId(wareId as string),
    },
    projection: { _id: 1, quantity: 1 } as Document,
  }) as Document;

  if (toInv) {
    await inventory.findOneAndUpdate({
      filter: { _id: toInv._id as ObjectId },
      update: {
        $inc: { quantity: quantity as number },
        $set: { updatedAt: new Date() },
      },
      projection: { _id: 1, quantity: 1 },
    });
  }

  return {
    fromUnit: await inventory.findOne({
      filters: { _id: fromInv._id as ObjectId },
      projection: get?.fromUnit || { _id: 1 },
    }),
    toUnit: toInv
      ? await inventory.findOne({
        filters: { _id: toInv._id as ObjectId },
        projection: get?.toUnit || { _id: 1 },
      })
      : null,
    quantity,
  };
};
