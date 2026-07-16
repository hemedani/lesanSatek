"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";

export const receiveGoods = async (
  data: { purchasingRequestId: string; wareModelId: string; quantity: number; unitId: string },
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();

    const receiptNumber = `GR-${Date.now()}`;

    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "goodsReceipt",
      act: "add",
      details: {
        set: {
          activeRoleId,
          receiptNumber,
          status: "completed",
          receivedAt: new Date(),
          description: "دریافت کالا توسط کارمند",
          items: [
            {
              wareModelId: data.wareModelId,
              quantityReceived: data.quantity,
              quantityAccepted: data.quantity,
              quantityRejected: 0,
            },
          ],
          purchasingRequestId: data.purchasingRequestId,
          receivedById: "",
          receivingUnitId: data.unitId,
        },
        get: { _id: 1, receiptNumber: 1, status: 1 },
      },
    });

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در دریافت کالا" },
    };
  }
};
