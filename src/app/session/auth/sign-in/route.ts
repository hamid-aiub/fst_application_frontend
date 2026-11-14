import { NextResponse } from "next/server";
import { authSessionSchema, signInSchema } from "@/lib/auth-schema";
import { getApiBaseUrl, readJson, setSessionCookies, upstreamMessage } from "@/lib/auth-server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Enter your sign-in details." }, { status: 400 });
  }

  const parsed = signInSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check your sign-in details." },
      { status: 400 },
    );
  }

  const { identifier, password } = parsed.data;
  const credentials = identifier.includes("@")
    ? { email: identifier, password }
    : { employeeId: identifier, password };

  try {
    const upstream = await fetch(`${getApiBaseUrl()}/auth/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await readJson(upstream);

    if (!upstream.ok) {
      const message = upstream.status === 401
        ? "The email/employee ID or password is incorrect."
        : upstreamMessage(payload, "We couldn’t sign you in. Please try again.");
      return NextResponse.json({ message }, { status: upstream.status });
    }

    const session = authSessionSchema.safeParse(payload);
    if (!session.success) {
      return NextResponse.json(
        { message: "The server returned an unexpected sign-in response." },
        { status: 502 },
      );
    }

    const response = NextResponse.json({ user: session.data.user });
    setSessionCookies(response, session.data);
    return response;
  } catch (error) {
    console.error("[Auth] Sign-in request could not reach the backend:", error);
    return NextResponse.json(
      { message: "Can’t reach the FST server right now. Please try again shortly." },
      { status: 502 },
    );
  }
}
