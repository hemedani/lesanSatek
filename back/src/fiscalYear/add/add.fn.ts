import { type ActFn, ObjectId } from "lesan";
import { fiscalYear } from "../../../mod.ts";

export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;

  const { activeRoleId, ...rest } = set;

  return await fiscalYear.insertOne({
    doc: rest,
    projection: get,
  });
};
