import { NextRequest } from "next/server";

export function originOf(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? req.nextUrl.host;
  return `${proto}://${host}`;
}
export function bad(msg: string, status = 400) {
  return Response.json({ error: msg }, { status });
}
