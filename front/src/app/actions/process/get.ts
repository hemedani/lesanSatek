"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const get = async (
  data: ReqType["main"]["process"]["get"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["process"]["get"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "process",
      act: "get",
      details: {
        set: data,
        get: getSelection || {
          _id: 1,
          name: 1,
          description: 1,
          status: 1,
          version: 1,
          isActive: 1,
          organization: { _id: 1, name: 1 },
          createdBy: { _id: 1, first_name: 1, last_name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت فرآیند" },
    };
  }
};
