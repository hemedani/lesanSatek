import type { ActFn, Document } from "lesan";
import { organization } from "../../../mod.ts";
import { getAuth } from "../../../utils/grantAccess.ts";
import {
  applyOrganizationReadScope,
  organizationReadScope,
} from "../../../utils/readScope.ts";

export const countFn: ActFn = async (body) => {
  const {
    set: { search },
  } = body.details;

  const { user, activeRole } = await getAuth();
  const scope = organizationReadScope(activeRole, user);

  const filters: Document = {};

  search &&
    (filters["$or"] = [
      { name: { $regex: search, $options: "i" } },
      { enName: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ]);

  const scopePipeline: Document[] = [];
  applyOrganizationReadScope(scopePipeline, scope);

  if (scopePipeline.length > 0) {
    filters["$and"] = scopePipeline.map((stage) => stage.$match);
  }

  const foundedItemsLength = await organization.countDocument({
    filter: filters,
  });

  return { qty: foundedItemsLength };
};
