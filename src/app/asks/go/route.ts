import { NextRequest, NextResponse } from "next/server";
import { COOKIE, COOKIE_PATH, keyMatches } from "@/lib/asks-auth";

export const dynamic = "force-dynamic";

/** `/asks/go?key=...` sets the cookie and lands on the log; `?out=1` clears it. */
export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const to = (p: string) => NextResponse.redirect(new URL(p, url), 303);
  const secure = url.protocol === "https:";

  if (url.searchParams.get("out")) {
    const res = to("/asks");
    res.cookies.set({ name: COOKIE, value: "", path: COOKIE_PATH, maxAge: 0, httpOnly: true, secure, sameSite: "lax" });
    return res;
  }

  const key = url.searchParams.get("key");
  if (!keyMatches(key)) return to("/asks?bad=1");
  const res = to("/asks");
  res.cookies.set({
    name: COOKIE,
    value: key!,
    path: COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: true,
    secure,
    sameSite: "lax",
  });
  return res;
}
