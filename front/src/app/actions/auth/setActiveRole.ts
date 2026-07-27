"use server";

import { cookies } from "next/headers";

import { getPanelForRole } from "@/lib/roles";
import { isSecureRequest } from "@/lib/server-action";

export const setActiveRole = async (roleId: string, roleName: string) => {
  try {
    const cookieStore = await cookies();
    const secure = await isSecureRequest();
    cookieStore.set("activeRoleId", roleId, {
      httpOnly: false,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    const targetPanel = getPanelForRole(roleName) || "/admin";

    return { success: true, body: { activeRoleId: roleId, targetPanel } };
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تنظیم نقش فعال" },
    };
  }
};
