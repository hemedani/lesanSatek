"use server";

import { AppApi } from "@/lib/api";
import { getToken, getActiveRoleId } from "@/lib/auth";

interface PostCompletionStepInput {
  name: string;
  unitId: string;
  description?: string;
  comment?: string;
}

interface FinalizeSet {
  _id: string;
  finalWinner?: "stuff" | "tender";
  budgetLineId?: string;
  postCompletionSteps?: PostCompletionStepInput[];
}

export const finalize = async (
  data: FinalizeSet,
  getSelection?: Record<string, unknown>
) => {
  try {
    const token = await getToken();
    const activeRoleId = await getActiveRoleId();
    const result = await AppApi(undefined, token).send({
      service: "main",
      model: "purchasingRequest",
      act: "finalize",
      details: {
        set: { ...data, activeRoleId },
        get: getSelection || { _id: 1, title: 1, status: 1, finalizedAt: 1, completedAt: 1 },
      },
    });

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در نهایی‌سازی درخواست خرید" },
    };
  }
};
