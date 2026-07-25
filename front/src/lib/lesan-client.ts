import type { ReqType } from "@/types/declarations/selectInp";

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export const lesanApi = (
  { URL, settings, baseHeaders }: {
    URL: string;
    settings?: Record<string, any>;
    baseHeaders?: Record<string, any>;
  },
) => {
  const setting = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...baseHeaders,
    },
    ...settings,
  };

  const setHeaders = (headers: Record<string, any>) => {
    setting.headers = {
      ...setting.headers,
      ...headers,
    };
  };

  const getSetting = () => setting;

  const send = async <
    TService extends keyof ReqType,
    TModel extends keyof ReqType[TService],
    TAct extends keyof ReqType[TService][TModel],
    // @ts-ignore: Unreachable code error
    TSet extends DeepPartial<ReqType[TService][TModel][TAct]["set"]>,
    // @ts-ignore: Unreachable code error
    TGet extends DeepPartial<ReqType[TService][TModel][TAct]["get"]>,
  >(body: {
    service?: TService;
    model: TModel;
    act: TAct;
    details: {
      set: TSet;
      get: TGet;
    };
  }, additionalHeaders?: Record<string, any>) => {
    const req = await fetch(URL, {
      ...getSetting(),
      headers: {
        ...getSetting().headers,
        ...additionalHeaders,
        connection: "keep-alive",
      },
      body: JSON.stringify(body),
    });

    const data = await req.json();

    if (
      data?.success === false &&
      data?.body?.message === "user not exist" &&
      (getSetting().headers as Record<string, string>)?.token
    ) {
      try {
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();
        cookieStore.delete("token");
        cookieStore.delete("activeRoleId");
      } catch {
        // Not in a server context — safe to ignore
      }
    }

    return data;
  };

  return { send, setHeaders };
};
