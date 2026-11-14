import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  clearSessionCookies,
  getApiBaseUrl,
  readJson,
  REFRESH_COOKIE,
} from "@/lib/auth-server";

export async function POST() {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${getApiBaseUrl()}/auth/sign-out`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(2_000),
      }).then(readJson);
    } catch {
      // Clear the browser session even if the API is temporarily unavailable.
    }
  }

  const response = NextResponse.json({ message: "Signed out." });
  clearSessionCookies(response);
  return response;
}
