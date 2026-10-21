import { type ActFn, type Document, ObjectId } from "lesan";
import { inventory, unit } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import { throwError } from "../../../utils/throwError.ts";

export const getFn: ActFn = async (body) => {
  const {
    set: { _id },
    get,
  } = body.details;

  const { user, activeRole } = await getAuth();
  const inventoryId = new ObjectId(_id as string);

  const record = await inventory.findOne({
    filters: { _id: inventoryId },
    projection: { unit: { _id: 1, organization: { _id: 1 } } },
  }) as Document;

  if (!(user.isGhost || isManagerLike(activeRole))) {
    if (!record) throwError("You cant do this");

    const unitRelation = record.unit as
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

    let organizationId = unitRelation?.organization?._id === null ||
        unitRelation?.organization?._id === undefined
      ? ""
      : String(unitRelation.organization._id);

    if (!unitId) throwError("You cant do this");

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
      }
    } else if (activeRole.name === "UnitHead") {
      if (
        activeRole.scopeType !== "unit" ||
        !activeRole.scopeId ||
        String(activeRole.scopeId) !== unitId
      ) {
        throwError("You cant do this");
      }
    } else if (activeRole.name === "Employee") {
      const userUnits =
        (user as unknown as { units?: { _id?: unknown }[] }).units ?? [];

      if (!userUnits.some((candidate) => String(candidate._id) === unitId)) {
        throwError("You cant do this");
      }
    } else {
      throwError("You cant do this");
    }
  }

  return await inventory
    .aggregation({
      pipeline: [{ $match: { _id: inventoryId } }],
      projection: get,
    })
    .toArray();
};
