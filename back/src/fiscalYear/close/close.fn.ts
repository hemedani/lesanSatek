import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";
import { checkFinanceUnitAccess } from "../../../utils/checkFinanceUnitAccess.ts";

export const closeFn: ActFn = async (body) => {
  await checkFinanceUnitAccess();
  const {
    set: { _id },
    get,
  } = body.details;

  return await fiscalYear.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: {
        status: "closed",
        isActive: false,
        updatedAt: new Date(),
      },
    },
    projection: get,
  });
};
