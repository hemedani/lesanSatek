type AllowWareHolder = {
  allowWareTypeIds?: string[];
  allowWareClassIds?: string[];
  allowWareGroupIds?: string[];
  allowWareModelIds?: string[];
};

type WareModelRef = {
  _id: string;
  wareType?: { _id: string };
  wareClass?: { _id: string };
  wareGroup?: { _id: string };
};

function isAllowed(allowIds: string[] | undefined, targetId: string): boolean {
  if (!allowIds || allowIds.length === 0) return true;
  return allowIds.includes(targetId);
}

export function unitCanAccessWareModel(
  holder: AllowWareHolder,
  wareModel: WareModelRef,
): boolean {
  return (
    isAllowed(holder.allowWareTypeIds, wareModel.wareType?._id ?? "") &&
    isAllowed(holder.allowWareClassIds, wareModel.wareClass?._id ?? "") &&
    isAllowed(holder.allowWareGroupIds, wareModel.wareGroup?._id ?? "") &&
    isAllowed(holder.allowWareModelIds, wareModel._id)
  );
}

type UserWithUnits = AllowWareHolder & {
  units?: AllowWareHolder[];
};

export function userCanAccessWareModel(
  user: UserWithUnits,
  wareModel: WareModelRef,
): boolean {
  if (unitCanAccessWareModel(user, wareModel)) return true;
  if (user.units?.some((unit) => unitCanAccessWareModel(unit, wareModel))) {
    return true;
  }
  return false;
}
