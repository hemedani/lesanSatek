"use server";

import { cookies } from "next/headers";

export const setActiveRole = async (roleId: string) => {
  try {
    const cookieStore = await cookies();
    cookieStore.set("activeRoleId", roleId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return { success: true, body: { activeRoleId: roleId } };
  } catch (error: unknown) {
    return {
      success: false,
      body: { message: error instanceof Error ? error.message : "خطا در تنظیم نقش فعال" },
    };
  }
};
