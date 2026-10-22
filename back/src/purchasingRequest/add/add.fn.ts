import { type ActFn, ObjectId } from "lesan";
import { coreApp, purchasingRequest, unit, wareModel } from "../../../mod.ts";
import type { MyContext } from "@lib";
import { assertWareModelAccess } from "../../../utils/checkWareModelAccess.ts";
import { throwError } from "../../../utils/throwError.ts";
import type { ActiveRole } from "../../../utils/authzPolicy.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";

type UnitDoc = {
  _id?: unknown;
  organization?: { _id?: unknown } | null;
};

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  const {
    activeRoleId,
    wareModelId,
    title,
    description,
    quantity,
    requestingUnitId: payloadUnitId,
  } = set;

  const activeRole = (user.roles || []).find(
    (r: { roleId: string }) => r.roleId === activeRoleId,
  ) as ActiveRole | undefined;

  if (!activeRole) {
    throwError("Active role not found");
    return;
  }

  const payloadUnit = normalizeId(payloadUnitId);
  const scopedUnit = activeRole.scopeType === "unit"
    ? normalizeId(activeRole.scopeId)
    : null;

  const bypass = Boolean(user.isGhost) || isManagerLike(activeRole);
  let requestingUnitId: string | null;

  if (bypass) {
    requestingUnitId = payloadUnit ?? scopedUnit;

    if (!requestingUnitId) {
      throwError("requestingUnitId is required");
      return;
    }
  } else switch (activeRole.name) {
    case "UnitHead":
    case "Employee":
    case "Ordinary":
      if (!scopedUnit) {
        throwError("Your active role does not have an associated unit.");
        return;
      }
      if (payloadUnit && payloadUnit !== scopedUnit) {
        throwError("You cant do this");
        return;
      }
      requestingUnitId = scopedUnit;
      break;
    case "OrgHead":
      if (!payloadUnit) {
        throwError("requestingUnitId is required");
        return;
      }
      requestingUnitId = payloadUnit;
      break;
    case "Manager":
    case "Admin":
      if (payloadUnit) {
        requestingUnitId = payloadUnit;
      } else if (scopedUnit) {
        requestingUnitId = scopedUnit;
      } else {
        throwError("requestingUnitId is required");
        return;
      }
      break;
    default:
      throwError("You cant do this");
      return;
  }

  const requestingUnit = await unit.findOne({
    filters: { _id: new ObjectId(requestingUnitId) },
    projection: { _id: 1, organization: { _id: 1 } },
  }) as UnitDoc | null;

  if (!requestingUnit) {
    throwError("Unit not found");
    return;
  }

  const organizationId = normalizeId(requestingUnit.organization?._id);

  if (!organizationId) {
    throwError(
      "Could not determine organization. Please ensure the unit belongs to an organization.",
    );
    return;
  }

  if (
    activeRole.name === "OrgHead" &&
    (activeRole.scopeType !== "organization" ||
      normalizeId(activeRole.scopeId) !== organizationId)
  ) {
    throwError("You cant do this");
    return;
  }

  if (!isManagerLike(activeRole) && !user.isGhost) {
    if (
      activeRole.name === "UnitHead" || activeRole.name === "Employee" ||
      activeRole.name === "Ordinary"
    ) {
      if (normalizeId(activeRole.scopeId) !== requestingUnitId) {
        throwError("You cant do this");
        return;
      }
    }
  }

  const wareModelDoc = await wareModel.findOne({
    filters: { _id: new ObjectId(wareModelId as string) },
    projection: {
      _id: 1,
      wareType: { _id: 1 },
      wareClass: { _id: 1 },
      wareGroup: { _id: 1 },
    },
  }) as Record<string, unknown> | null;

  if (!wareModelDoc) {
    throwError("Ware model not found");
    return;
  }

  await assertWareModelAccess(
    user,
    activeRole,
    wareModelDoc,
  );

  const result = await purchasingRequest.insertOne({
    doc: {
      title,
      description,
      quantity,
      status: "Draft",
      history: [{
        action: "created",
        performed: {
          by: user._id.toString(),
          name: `${user.first_name} ${user.last_name}`,
          at: new Date(),
          role: {
            id: activeRole.roleId,
            name: activeRole.name,
            scopeType: activeRole.scopeType,
            scopeId: activeRole.scopeId,
          },
        },
        details: {},
      }],
    },
    relations: {
      requester: {
        _ids: user._id,
        relatedRelations: { requests: true },
      },
      wareModel: {
        _ids: new ObjectId(wareModelId as string),
        relatedRelations: { purchasingRequests: true },
      },
      requestingUnit: {
        _ids: new ObjectId(requestingUnitId),
        relatedRelations: { purchaseRequests: true },
      },
      organization: {
        _ids: new ObjectId(organizationId),
        relatedRelations: { purchaseRequests: true },
      },
    },
    projection: get,
  });

  return result;
};
