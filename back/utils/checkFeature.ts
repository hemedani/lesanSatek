import { feature_array } from "../models/featureConstants.ts";
import { type ActiveRole, isManagerLike } from "./authzPolicy.ts";

type Feature = typeof feature_array[number];

type UserWithFeatures = {
  features?: { feature: Feature }[];
  units?: UnitWithFeatures[];
};

type UnitWithFeatures = {
  _id?: unknown;
  features?: { feature: Feature }[];
  organization?: { _id?: unknown } | null;
};

const normalizeId = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);

export function hasFeature(
  user: UserWithFeatures,
  feature: Feature,
  activeRole: ActiveRole,
): boolean {
  if (user.features?.some((f) => f.feature === feature)) return true;

  if (isManagerLike(activeRole)) return true;

  if (activeRole.scopeType === "unit") {
    if (!activeRole.scopeId) return false;
    const unit = user.units?.find((candidate) =>
      normalizeId(candidate._id) === normalizeId(activeRole.scopeId)
    );
    return unit ? hasUnitFeature(unit, feature) : false;
  }

  if (activeRole.scopeType === "organization") {
    if (!activeRole.scopeId) return false;
    return user.units?.some((unit) =>
      Boolean(unit.organization) &&
      normalizeId(unit.organization?._id) === normalizeId(activeRole.scopeId) &&
      hasUnitFeature(unit, feature)
    ) ?? false;
  }

  return false;
}

export function hasUnitFeature(
  unit: UnitWithFeatures,
  feature: Feature,
): boolean {
  return unit.features?.some((f) => f.feature === feature) ?? false;
}
