import { type ActFn, ObjectId } from "lesan";
import { process, purchasingRequest } from "../../../mod.ts";
import { throwError } from "../../../utils/throwError.ts";

export const updateFn: ActFn = async (body) => {
  const {
    set: { _id, name, description, status, version, isActive },
    get,
  } = body.details;

  const updateObj: Record<string, any> = {
    updatedAt: new Date(),
  };

  name && (updateObj.name = name);
  description && (updateObj.description = description);
  status && (updateObj.status = status);
  version !== undefined && (updateObj.version = version);
  isActive !== undefined && (updateObj.isActive = isActive);

  // Archive guard: prevent archiving while in-flight PRs exist
  if (status === "Archived") {
    const activeRequestCount = await purchasingRequest.countDocument({
      filter: {
        process: new ObjectId(_id as string),
        status: { $in: ["Pending", "InProgress", "Approved"] },
      },
    });

    if (activeRequestCount > 0) {
      throwError(
        `Cannot archive process: ${activeRequestCount} purchasing request(s) are still in progress. ` +
        `Complete or cancel all active requests first.`,
      );
      return;
    }
  }

  return await process.findOneAndUpdate({
    filter: { _id: new ObjectId(_id as string) },
    update: {
      $set: updateObj,
    },
    projection: get,
  });
};
