import {
  getAuth,
  grantAccess,
  type MyContext,
  setTokens,
  setUser,
  throwError,
} from "@lib";
import { coreApp } from "../../../mod.ts";
import { isManagerLike } from "../../../utils/authzPolicy.ts";
import { addUserFn } from "./addUser.fn.ts";
import { addUserValidator } from "./addUser.val.ts";

export const authorizeNewUserScope = async () => {
  const context = coreApp.contextFns.getContextModel() as MyContext;

  if (context.user?.isGhost) return;

  const { activeRole } = await getAuth();

  if (isManagerLike(activeRole)) return;

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

    return;
  }

  set.organizations = [scopeId];
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
