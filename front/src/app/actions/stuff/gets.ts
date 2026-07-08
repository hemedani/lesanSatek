"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["stuff"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["stuff"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "stuff",
      act: "gets",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, inventoryNo: 1, price: 1, hasAbsolutePrice: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست موجودی فروشگاه‌ها" },
    };
  }
};
