import { type Document, ObjectId } from "lesan";
import { process } from "../../mod.ts";
import type { ActiveRole } from "../../utils/authzPolicy.ts";
import { isScopeBypass } from "../../utils/authzPolicy.ts";
import type { ScopeUser } from "../../utils/readScope.ts";
import { throwError } from "../../utils/throwError.ts";
import {
  assertCanReadProcess,
  processReadMatch,
} from "../process/readScope.ts";

type ProcessStepRef = {
  process?: { _id?: unknown } | null;
};

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  return String(value);
};

export const processStepProcessIds = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
): Promise<ObjectId[] | null> => {
  if (isScopeBypass(activeRole, user)) return null;

  const match = await processReadMatch(activeRole, user);

  if (!match) return null;

  const docs = await process.find({
    filters: match,
    projection: { _id: 1 },
  }).toArray();

  return docs
    .map((doc) => doc._id)
    .filter((id): id is ObjectId => id instanceof ObjectId);
};

export const assertCanReadProcessStep = async (
  activeRole: ActiveRole,
  user: ScopeUser | undefined,
  stepDoc: ProcessStepRef | null | undefined,
): Promise<void> => {
  if (isScopeBypass(activeRole, user)) return;
  if (!stepDoc) {
    throwError("You cant do this");
    return;
  }

  const processId = normalizeId(stepDoc.process?._id);

  if (!processId) {
    throwError("You cant do this");
    return;
  }

  let processObjectId: ObjectId;

  try {
    processObjectId = new ObjectId(processId);
  } catch {
    throwError("You cant do this");
    return;
  }

  const processDoc = await process.findOne({
    filters: { _id: processObjectId },
    projection: { organization: { _id: 1 }, unit: { _id: 1 } },
  }) as Document | null;

  await assertCanReadProcess(activeRole, user, processDoc);
};
