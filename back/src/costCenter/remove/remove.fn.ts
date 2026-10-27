import { type ActFn, type Document, ObjectId } from "lesan";
import { costCenter, journalEntryLine } from "../../../mod.ts";
import { assertAccountingOrganizationAccess } from "../../../utils/accountingScope.ts";
import { throwError } from "../../../utils/throwError.ts";

export const removeFn: ActFn = async (body) => {
  const {
    set: { _id, hardCascade },
  } = body.details;

  const costCenterId = new ObjectId(_id as string);
  const founded = await costCenter.findOne({
    filters: { _id: costCenterId },
    projection: { organization: { _id: 1 } },
  }) as Document | null;

  if (!founded) throwError("Cost center not found");

  await assertAccountingOrganizationAccess(
    (founded!.organization as Record<string, unknown> | undefined)?._id,
  );

  const lineCount = await journalEntryLine.countDocument({
    filter: { "costCenter._id": costCenterId },
  });

  if (lineCount > 0) {
    throwError("Cost center has journal entries and cannot be deleted");
  }

  return await costCenter.deleteOne({
    filter: { _id: costCenterId },
    hardCascade: hardCascade || false,
  });
};
