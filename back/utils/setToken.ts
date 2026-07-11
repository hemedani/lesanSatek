import * as jwt from "djwt";
import { coreApp } from "../mod.ts";
import { throwError } from "./throwError.ts";

const secretKey = Deno.env.get("TOKEN_KEY") || "simpleSecretKey";
const encoder = new TextEncoder();
const keyBuf = encoder.encode(secretKey || "mySuperSecret");
export const jwtTokenKey = await crypto.subtle.importKey(
  "raw",
  keyBuf,
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export const setTokens = async () => {
  const { Headers } = coreApp.contextFns.getContextModel();
  const token = Headers.get("token");

  if (!token) {
    throwError("you should send your id with token key in req header");
  }

  try {
    const verifyToke = await jwt.verify(token, jwtTokenKey);
    coreApp.contextFns.setContext({ user: verifyToke });
  } catch (_e) {
    throwError("Invalid or expired token");
  }
};
