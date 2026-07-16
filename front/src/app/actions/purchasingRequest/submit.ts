"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const submit = async (
  data: ReqType["main"]["purchasingRequest"]["submit"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["purchasingRequest"]["submit"]["get"]>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "submit",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, status: 1 },
      },
    });


    /*
    *	@LOG @DEBUG @INFO
    *	This log written by ::==> {{ `` }}
    *
    *	Please remove your log after debugging
    */
    console.log(" ============= ");
    console.group("data,activeRoleId ------ ");
    console.log();
    console.info({ data, activeRoleId }, " ------ ");
    console.log();
    console.groupEnd();
    console.log(" ============= ");

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ارسال درخواست خرید" },
    };
  }
};
