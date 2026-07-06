"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const award = async (
  data: ReqType["main"]["tender"]["award"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["tender"]["award"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "tender",
      act: "award",
      details: {
        set: data,
        get: getSelection || { _id: 1, title: 1, status: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در اعطای مناقصه" },
    };
  }
};
