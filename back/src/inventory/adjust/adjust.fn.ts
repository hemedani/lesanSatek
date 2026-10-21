import { type ActFn, type Document, ObjectId } from "lesan";
import { coreApp, inventory, unit } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { throwError } from "../../../utils/throwError.ts";

export const adjustFn: ActFn = async (body) => {
  const {
    set: { _id, quantity, activeRoleId },
    get,
  } = body.details;

  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as { name: string; scopeType?: string; scopeId?: string } | undefined;

  const isUnrestricted = user.isGhost ||
    (activeRole && ["Manager", "Admin"].includes(activeRole.name));

  if (!isUnrestricted) {
    if (!activeRole) {
      throwError("Active role not found");
      return;
    }

    const inventoryId = new ObjectId(_id as string);

    const inv = await inventory.findOne({
      filters: { _id: inventoryId },
      projection: {
        unit: { _id: 1, organization: { _id: 1 } },
        wareModel: { _id: 1 },
        wareType: { _id: 1 },
        wareClass: { _id: 1 },
        wareGroup: { _id: 1 },
      },
    }) as Document | null;

    if (!inv) {
      throwError("Inventory not found");
      return;
    }

    const unitRelation = inv.unit as
      | {
        _id?: unknown;
        organization?: { _id?: unknown } | null;
      }
      | null
      | undefined;

    const unitId = unitRelation?._id === null ||
        unitRelation?._id === undefined
      ? ""
      : String(unitRelation._id);

    if (!unitId) {
      throwError("You cant do this");
      return;
    }

    await assertWareModelAccess(user, activeRole as ActiveRole, {
      _id: (inv.wareModel as Record<string, unknown>)?._id,
      wareType: inv.wareType as { _id?: unknown },
      wareClass: inv.wareClass as { _id?: unknown },
      wareGroup: inv.wareGroup as { _id?: unknown },
    });

    let organizationId = unitRelation?.organization?._id === null ||
        unitRelation?.organization?._id === undefined
      ? ""
      : String(unitRelation.organization._id);

    if (!organizationId) {
      const unitDoc = await unit.findOne({
        filters: { _id: new ObjectId(unitId) },
        projection: { organization: { _id: 1 } },
      }) as Document;
      const organizationRef =
        (unitDoc?.organization as { _id?: unknown } | null | undefined)?._id;
      organizationId = organizationRef === null || organizationRef === undefined
        ? ""
        : String(organizationRef);
    }

    if (activeRole.name === "OrgHead") {
      if (
        activeRole.scopeType !== "organization" ||
        !activeRole.scopeId ||
        String(activeRole.scopeId) !== organizationId
      ) {
        throwError("You cant do this");
        return;
      }
    } else if (activeRole.name === "UnitHead") {
      if (
        activeRole.scopeType !== "unit" ||
        !activeRole.scopeId ||
        String(activeRole.scopeId) !== unitId
      ) {
        throwError("You can only adjust inventory in your own unit");
        return;
      }
    } else if (activeRole.name === "Employee") {
      const userUnits =
        (user as unknown as { units?: { _id?: unknown }[] }).units ?? [];

      if (!userUnits.some((candidate) => String(candidate._id) === unitId)) {
        throwError("You cant do this");
        return;
      }
    } else {
      throwError("You cant do this");
      return;
    }
  }

  return await inventory.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        quantity,
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
