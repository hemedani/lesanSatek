"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const convertToSpend = async (
  data: ReqType["main"]["budgetEncumbrance"]["convertToSpend"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["budgetEncumbrance"]["convertToSpend"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "budgetEncumbrance",
      act: "convertToSpend",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, amount: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تبدیل تعهد به هزینه" },
    };
  }
};
