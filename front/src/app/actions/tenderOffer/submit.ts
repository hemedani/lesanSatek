"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const submit = async (
  data: ReqType["main"]["tenderOffer"]["submit"]["set"],
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
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ثبت پیشنهاد" },
    };
  }
};
