import {
  type ActiveRole,
  isManagerLike,
  isRoleAllowed,
  type RoleName,
  scopeMatches,
  type ScopeRef,
} from "./authzPolicy.ts";
import { hasFeature } from "./checkFeature.ts";
import { feature_array } from "../models/featureConstants.ts";
import { throwError } from "./throwError.ts";

export type Feature = typeof feature_array[number];

export type GrantBody = {
  details: { set: Record<string, unknown> };
};

export type ScopeResolver = (
  body: GrantBody,
  user: unknown,
) => Promise<ScopeRef | null> | ScopeRef | null;

export type RoleCheck = {
  roles: RoleName[];
  features?: Feature[];
  scope?: ScopeResolver;
};

type AuthUser = {
  isGhost?: boolean;
  features?: { feature: Feature }[];
  units?: {
    _id?: unknown;
    features?: { feature: Feature }[];
    organization?: { _id?: unknown } | null;
  }[];
  roles?: ActiveRole[];
};

type AuthContext = {
  user?: AuthUser;
  body?: GrantBody;
};

type ContextGetter = () => AuthContext | Promise<AuthContext>;

const CORE_APP_MODULE = "../mod.ts";

type CoreApp = {
  contextFns: { getContextModel: () => unknown };
};

const loadCoreApp = async (): Promise<CoreApp> => {
  const mod = await import(CORE_APP_MODULE) as { coreApp: CoreApp };
  return mod.coreApp;
};

const defaultGetContext: ContextGetter = async () => {
  const coreApp = await loadCoreApp();
  return coreApp.contextFns.getContextModel() as AuthContext;
};

const readAuth = (user: AuthUser | undefined, body: GrantBody | undefined) => {
  if (!user) throwError("Active role not found");

  const activeRoleId = body?.details?.set?.activeRoleId;

  if (!activeRoleId) {
    throwError("activeRoleId is required");
  }

  const activeRole = (user?.roles ?? []).find((role) =>
    role.roleId === activeRoleId
  );

  if (!activeRole) {
    throwError("Active role not found");
  }

  return { user: user!, activeRole: activeRole!, body };
};

export const getAuth = async (
  getContext: ContextGetter = defaultGetContext,
) => {
  const context = await getContext();
  return readAuth(context?.user, context?.body);
};

export const grantAccess = (
  checks: RoleCheck[],
  getContext: ContextGetter = defaultGetContext,
) => {
  const checkAccess = async () => {
    const context = await getContext();
    const user = context?.user;

    if (user?.isGhost) return;

    const { activeRole, body } = readAuth(user, context?.body);

    const matchingChecks = checks.filter((check) =>
      isRoleAllowed(activeRole, check.roles)
    );

    if (matchingChecks.length === 0) {
      throwError("You cant do this");
    }

    for (const check of matchingChecks) {
      if (isManagerLike(activeRole)) return;

      if (
        check.features?.length &&
        !check.features.every((feature) =>
          hasFeature(user!, feature, activeRole)
        )
      ) {
        continue;
      }

      if (!check.scope) return;

      const scope = await check.scope(body as GrantBody, user);
      if (scopeMatches(activeRole, scope)) return;
    }

    throwError("You cant do this");
  };

  return checkAccess;
};

export const requireFeature = (feature: Feature) => {
  const checkFeature = async () => {
    const coreApp = await loadCoreApp();
    const { user } = coreApp.contextFns.getContextModel() as AuthContext;

    if (user?.isGhost) return;

    if (!hasFeature(user!, feature)) {
      throwError(`Missing feature: ${feature}`);
    }
  };

  return checkFeature;
};
