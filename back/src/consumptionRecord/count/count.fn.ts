import type { ActFn, Document } from "lesan";
import { ObjectId } from "lesan";
import { consumptionRecord } from "../../../mod.ts";

export const countFn: ActFn = async (body) => {
  const { set: { unitId, wareModelId, reason, patientId } } = body.details;

  const filters: Document = {};
  unitId && (filters.unit = new ObjectId(unitId as string));
  wareModelId && (filters.wareModelId = wareModelId);
  reason && (filters.reason = { $regex: new RegExp(reason as string, "i") });
  patientId && (filters.patientId = { $regex: new RegExp(patientId as string, "i") });

  const qty = await consumptionRecord.countDocument({ filter: filters });

  return { qty };
};
