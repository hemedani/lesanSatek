"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const gets = async (
  data: ReqType["main"]["unit"]["gets"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["unit"]["gets"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "unit",
      act: "gets",
      details: {
        set: data,
        get: getSelection || {
          _id: 1,
          name: 1,
          description: 1,
          isActive: 1,
          type: 1,
          organization: { _id: 1, name: 1 },
          parentUnit: { _id: 1, name: 1 },
          head: { _id: 1, first_name: 1, last_name: 1 },
        },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت لیست واحدها" },
    };
  }
};
