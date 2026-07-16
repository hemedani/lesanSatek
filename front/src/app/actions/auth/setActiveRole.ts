"use server";

import { cookies } from "next/headers";

import { getPanelForRole } from "@/lib/roles";

export const setActiveRole = async (roleId: string, roleName: string) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set("activeRoleId", roleId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
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
