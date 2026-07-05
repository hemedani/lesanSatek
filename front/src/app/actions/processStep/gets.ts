"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["processStep"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["processStep"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "processStep",
      act: "gets",
      details: {
        set: data,
        get: getSelection || {
          _id: 1,
          name: 1,
          stepType: 1,
          order: 1,
          required: 1,
          process: { _id: 1, name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست گام‌های فرآیند" },
    };
  }
};
