"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["stepApproval"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["stepApproval"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "stepApproval",
      act: "gets",
      details: {
        set: data,
        get: getSelection || { _id: 1, status: 1, comment: 1, decidedAt: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست تایید مراحل" },
    };
  }
};
