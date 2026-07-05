"use server";

import { AppApi } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const addUser = async (
  data: ReqType["main"]["user"]["addUser"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["addUser"]["get"]>
) => {
  try {
    const token = await getToken();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "user",
      act: "addUser",
      details: {
        set: data,
        get: getSelection || { _id: 1, first_name: 1, last_name: 1, email: 1 },
      },
    });
    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ایجاد کاربر" },
    };
  }
};
