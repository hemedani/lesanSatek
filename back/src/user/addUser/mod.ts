import { ObjectId } from "lesan";
import {
  getAuth,
  grantAccess,
  type MyContext,
  setTokens,
  setUser,
  throwError,
} from "@lib";
import { coreApp, unit } from "../../../mod.ts";
import { isScopeBypass } from "../../../utils/authzPolicy.ts";
import { addUserFn } from "./addUser.fn.ts";
import { addUserValidator } from "./addUser.val.ts";

const toObjectId = (value: unknown): ObjectId | null => {
  if (value === null || value === undefined || value === "") return null;

  try {
    return new ObjectId(String(value));
  } catch {
    return null;
  }
};

export const authorizeNewUserScope = async () => {
  const context = coreApp.contextFns.getContextModel() as MyContext;

  const { activeRole } = await getAuth();

  if (isScopeBypass(activeRole, context.user)) return;

  if (activeRole.scopeType !== "organization" || !activeRole.scopeId) {
    return throwError("You cant do this");
  }

  const set = context.body?.details?.set as
    | Record<string, unknown>
    | undefined;

  if (!set) return throwError("You cant do this");

  const organizations = set.organizations as string[] | undefined;
  const scopeId = String(activeRole.scopeId);

  if (organizations && organizations.length > 0) {
    const containsOutsideScope = organizations.some(
      (organizationId) => String(organizationId) !== scopeId,
    );

    if (containsOutsideScope) throwError("You cant do this");
  }

  const units = set.units as string[] | undefined;

  if (units && units.length > 0) {
    for (const unitId of units) {
      const unitObjectId = toObjectId(unitId);

      if (!unitObjectId) return throwError("You cant do this");

      const unitDoc = await unit.findOne({
        filters: { _id: unitObjectId },
        projection: { organization: { _id: 1 } },
      }) as { organization?: { _id?: unknown } } | null;

      const organizationId = unitDoc?.organization?._id;

      if (
        organizationId === null || organizationId === undefined ||
        String(organizationId) !== scopeId
      ) {
        return throwError("You cant do this");
      }
    }
  }
};

export const addUserSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "addUser",
    validationRunType: "create",
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Manager", "Admin"] },
        { roles: ["OrgHead"] },
      ]),
      authorizeNewUserScope,
    ],
    validator: addUserValidator(),
    fn: addUserFn,
  });
