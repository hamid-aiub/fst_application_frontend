import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { authSessionSchema } from "@/lib/auth-schema";
import {
  ACCESS_COOKIE,
  clearSessionCookies,
  getApiBaseUrl,
  readJson,
  REFRESH_COOKIE,
  setSessionCookies,
} from "@/lib/auth-server";

type RouteContext = { params: Promise<{ path: string[] }> };

async function refreshSession(refreshToken: string) {
  const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) return null;
  const parsed = authSessionSchema.safeParse(await readJson(response));
  return parsed.success ? parsed.data : null;
}

async function handle(request: Request, context: RouteContext) {
  try {
    const [{ path }, cookieStore] = await Promise.all([context.params, cookies()]);
    if (!path.length) return NextResponse.json({ message: "An API resource is required." }, { status: 404 });

    const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
    let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
    let rotatedSession: ReturnType<typeof authSessionSchema.parse> | undefined;

    if (!accessToken && refreshToken) {
      rotatedSession = (await refreshSession(refreshToken)) ?? undefined;
      accessToken = rotatedSession?.accessToken;
    }
    if (!accessToken) {
      const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
      clearSessionCookies(response);
      return response;
    }

    const incomingUrl = new URL(request.url);
    const resourcePath = path.map((segment) => encodeURIComponent(segment)).join("/");
    const targetUrl = `${getApiBaseUrl()}/${resourcePath}${incomingUrl.search}`;
    const method = request.method.toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
    const headers = new Headers();
    const contentType = request.headers.get("content-type");
    const accept = request.headers.get("accept");
    if (contentType) headers.set("content-type", contentType);
    if (accept) headers.set("accept", accept);

    const forward = (token: string) => fetch(targetUrl, {
      method,
      headers: new Headers([...headers, ["authorization", `Bearer ${token}`]]),
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });

    let upstream = await forward(accessToken);
    if (upstream.status === 401 && refreshToken && !rotatedSession) {
      rotatedSession = (await refreshSession(refreshToken)) ?? undefined;
      if (rotatedSession) {
        accessToken = rotatedSession.accessToken;
        upstream = await forward(accessToken);
      }
    }

    const responseHeaders = new Headers();
    for (const headerName of ["content-type", "content-disposition"]) {
      const value = upstream.headers.get(headerName);
      if (value) responseHeaders.set(headerName, value);
    }
    responseHeaders.set("cache-control", "no-store");
    const responseBody = upstream.status === 204 ? null : await upstream.arrayBuffer();
    const response = new NextResponse(responseBody, {
      status: upstream.status,
      headers: responseHeaders,
    });

    if (upstream.status === 401) {
      clearSessionCookies(response);
    } else if (rotatedSession) {
      setSessionCookies(response, rotatedSession);
    }
    return response;
  } catch {
    return NextResponse.json(
      { message: "The backend service is currently unavailable." },
      { status: 502 },
    );
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
