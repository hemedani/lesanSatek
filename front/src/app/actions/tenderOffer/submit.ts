"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const submit = async (
  data: Omit<ReqType["main"]["tenderOffer"]["submit"]["set"], "activeRoleId" | "storeId" | "wareId"> & { activeRoleId?: string; storeId?: string; wareId?: string; submittedAt: Date },
  getSelection?: DeepPartial<ReqType["main"]["tenderOffer"]["submit"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "tenderOffer",
      act: "submit",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, price: 1, status: 1 },
      },
    });
    if (result.success) {
      revalidatePath("/storehead", "layout");
    }
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت پیشنهاد" },
    };
  }
};
