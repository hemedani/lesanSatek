"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const getWarehouseInventory = async (
  data: Omit<ReqType["main"]["inventory"]["getWarehouseInventory"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["inventory"]["getWarehouseInventory"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "inventory",
      act: "getWarehouseInventory",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || {
          _id: 1,
          quantity: 1,
          minQuantity: 1,
          maxQuantity: 1,
          batchNo: 1,
          expirationDate: 1,
          location: 1,
          lastCountedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          unit: { _id: 1, name: 1, type: 1 },
          warehouseUnit: { _id: 1, name: 1 },
          ware: { _id: 1, name: 1 },
          wareModel: { _id: 1, name: 1 },
          wareGroup: { _id: 1, name: 1 },
          wareClass: { _id: 1, name: 1 },
          wareType: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت موجودی انبار" },
    };
  }
};
