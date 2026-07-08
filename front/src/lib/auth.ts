import { cookies } from "next/headers";

export const getToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get("token")?.value;
};

export const getActiveRoleId = async (): Promise<string> => {
  const cookieStore = await cookies();
  return cookieStore.get("activeRoleId")?.value || "";
};
