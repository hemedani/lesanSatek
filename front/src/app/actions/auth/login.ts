"use server";

import { AppApi } from "@/lib/api";
import type { ReqType, DeepPartial } from "@/types/declarations/selectInp";
import { cookies } from "next/headers";

export const login = async (
  data: ReqType["main"]["user"]["login"]["set"],
  getSelection?: DeepPartial<ReqType["main"]["user"]["login"]["get"]>
) => {
  const cookieStore = await cookies();

  try {
    const result = await AppApi().send({
      service: "main",
      model: "user",
      act: "login",
      details: {
        set: data,
        get: getSelection || {
          token: 1,
          user: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            mobile: 1,
            email: 1,
            is_verified: 1,
            isActive: 1,
            isGhost: 1,
            position: 1,
            features: 1,
            roles: 1,
            organization: { _id: 1, name: 1 },
            avatar: { _id: 1, name: 1 },
          },
        },
      },
    });

    if (result.success && result.body?.token) {
      cookieStore.set("token", result.body.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      if (result.body.user?.roles?.length > 0) {
        const currentActiveRoleId = cookieStore.get("activeRoleId")?.value;
        const roleId = currentActiveRoleId || result.body.user.roles[0].roleId;
        cookieStore.set("activeRoleId", roleId, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در ورود به سامانه" },
    };
  }
};
