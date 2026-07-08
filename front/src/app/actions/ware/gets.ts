"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["ware"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["ware"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "ware",
      act: "gets",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, name: 1, enName: 1, brand: 1, price: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست کالاها" },
    };
  }
};
