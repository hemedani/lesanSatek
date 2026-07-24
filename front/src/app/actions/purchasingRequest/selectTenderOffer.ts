"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const selectTenderOffer = async (
  data: Omit<ReqType["main"]["purchasingRequest"]["selectTenderOffer"]["set"], "activeRoleId"> & { activeRoleId?: string },
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["selectTenderOffer"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "selectTenderOffer",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, selectionType: 1, selectedTenderOfferId: 1, estimatedAmount: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در انتخاب پیشنهاد مناقصه" },
    };
  }
};
