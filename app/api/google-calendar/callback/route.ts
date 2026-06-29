import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  encryptToken,
  exchangeCodeForTokens,
  getGoogleEmail,
} from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_calendar_oauth_state")?.value;

  cookieStore.delete("google_calendar_oauth_state");

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/organisation/agenda?google=cancelled`, request.url),
    );
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/dashboard/organisation/agenda?google=invalid-state`, request.url),
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code, request.nextUrl.origin);
    const existing = await prisma.googleCalendarConnection.findUnique({
      where: { userId: user.id },
    });
    const googleEmail = await getGoogleEmail(tokens.access_token).catch(() => null);
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : null;

    await prisma.googleCalendarConnection.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        googleEmail,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : null,
        tokenType: tokens.token_type ?? null,
        scope: tokens.scope ?? null,
        expiresAt,
      },
      update: {
        googleEmail,
        accessToken: encryptToken(tokens.access_token),
        refreshToken: tokens.refresh_token
          ? encryptToken(tokens.refresh_token)
          : existing?.refreshToken ?? null,
        tokenType: tokens.token_type ?? existing?.tokenType ?? null,
        scope: tokens.scope ?? existing?.scope ?? null,
        expiresAt,
      },
    });

    return NextResponse.redirect(
      new URL(`/dashboard/organisation/agenda?google=connected`, request.url),
    );
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/organisation/agenda?google=error`, request.url),
    );
  }
}
