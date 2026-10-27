import { type ActFn, type Document, ObjectId } from "lesan";
import { costCenter } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, activeRoleId: _activeRoleId, ...fields },
    get,
  } = body.details;

  const founded = await costCenter.findOne({
    filters: { _id: new ObjectId(_id as string) },
    projection: { organization: { _id: 1 } },
  }) as Document | null;

  if (!founded) throwError("Cost center not found");

  await assertAccountingOrganizationAccess(
    (founded!.organization as Record<string, unknown> | undefined)?._id,
  );

  const updateObj: Record<string, unknown> = { updatedAt: new Date() };
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) updateObj[key] = value;
  }

  return await costCenter.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: { $set: updateObj },
    projection: get,
  });
};
