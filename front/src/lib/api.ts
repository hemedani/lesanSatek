import { lesanApi } from "@/types/declarations/selectInp";

const getLesanUrl = () => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:1370";
  return url.endsWith("/lesan") ? url : `${url.replace(/\/$/, "")}/lesan`;
};

export const AppApi = (lesanUrl?: string, token?: string) => {
  return lesanApi({
    URL: lesanUrl || getLesanUrl(),
    baseHeaders: {
      connection: "keep-alive",
      ...(token ? { token } : {}),
    },
  });
};
