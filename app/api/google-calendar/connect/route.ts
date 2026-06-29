import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { buildGoogleAuthUrl, getGoogleCalendarConfig } from "@/lib/google-calendar";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const config = getGoogleCalendarConfig();
  if (!config.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/organisation/agenda?google=missing-config`,
        request.url,
      ),
    );
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const cookieStore = await cookies();
  cookieStore.set("google_calendar_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(request.nextUrl.origin, state));
}
