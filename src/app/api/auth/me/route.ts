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
  upstreamMessage,
} from "@/lib/auth-server";

export async function GET() {
  const cookieStore = await cookies();
  let accessToken = cookieStore.get(ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  let rotatedSession: ReturnType<typeof authSessionSchema.parse> | undefined;

  try {
    const apiBaseUrl = getApiBaseUrl();
    let upstream: Response | undefined;

    if (accessToken) {
      upstream = await fetch(`${apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
    }

    if ((!upstream || upstream.status === 401) && refreshToken) {
      const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      const refreshedPayload = await readJson(refreshResponse);

      if (refreshResponse.ok) {
        const refreshed = authSessionSchema.safeParse(refreshedPayload);
        if (refreshed.success) {
          rotatedSession = refreshed.data;
          accessToken = refreshed.data.accessToken;
          upstream = await fetch(`${apiBaseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
            signal: AbortSignal.timeout(15_000),
          });
        }
      } else {
        const response = NextResponse.json(
          { message: "Your session has expired. Please sign in again." },
          { status: 401 },
        );
        clearSessionCookies(response);
        return response;
      }
    }

    if (!upstream) {
      return NextResponse.json({ message: "You are not signed in." }, { status: 401 });
    }

    const payload = await readJson(upstream);
    if (!upstream.ok) {
      const response = NextResponse.json(
        { message: upstream.status === 401 ? "Your session has expired. Please sign in again." : upstreamMessage(payload, "Could not load your profile.") },
        { status: upstream.status },
      );
      if (upstream.status === 401) clearSessionCookies(response);
      return response;
    }

    const response = NextResponse.json(payload);
    if (rotatedSession) setSessionCookies(response, rotatedSession);
    return response;
  } catch {
    return NextResponse.json(
      { message: "Can’t reach the FST server right now." },
      { status: 502 },
    );
  }
}
