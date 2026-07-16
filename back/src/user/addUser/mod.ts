import {
  grantAccess,
  type MyContext,
  setTokens,
  setUser,
  throwError,
} from "@lib";
import { coreApp } from "../../../mod.ts";
import { addUserFn } from "./addUser.fn.ts";
import { addUserValidator } from "./addUser.val.ts";

export const checkGhostUser = () => {
  const { user, body }: MyContext = coreApp.contextFns
    .getContextModel() as MyContext;

  if (user.isGhost) {
    return;
  }

  const insertedRoles = body?.details.set?.roles as
    | { name: string }[]
    | undefined;

  if (!insertedRoles || insertedRoles.length === 0) {
    return;
  }

  if (insertedRoles.some((r) => r.name === "Ghost")) {
    throwError("Sorry can not add this role");
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
        { roles: ["OrgHead"], getScope: (b) => {
          const orgs = b?.details?.set?.organizations as string[] | undefined;
          return orgs?.[0]
            ? { scopeType: "organization", scopeId: orgs[0] }
            : null;
        }},
      ]),
      checkGhostUser,
    ],
    validator: addUserValidator(),
    fn: addUserFn,
  });
