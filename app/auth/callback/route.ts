import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function buildRedirectUrl(
  request: Request,
  path: string,
) {
  const { origin } = new URL(request.url);

  const forwardedHost =
    request.headers.get("x-forwarded-host");

  const isLocal =
    process.env.NODE_ENV === "development";

  if (isLocal) {
    return `${origin}${path}`;
  }

  if (forwardedHost) {
    return `https://${forwardedHost}${path}`;
  }

  return `${origin}${path}`;
}

function isNewOAuthUser(
  createdAt?: string,
  lastSignInAt?: string,
) {
  if (!createdAt || !lastSignInAt) {
    return false;
  }

  const created =
    new Date(createdAt).getTime();

  const lastSignIn =
    new Date(lastSignInAt).getTime();

  if (
    Number.isNaN(created) ||
    Number.isNaN(lastSignIn)
  ) {
    return false;
  }

  /*
   * Для щойно створеного OAuth-користувача
   * created_at і last_sign_in_at майже збігаються.
   *
   * Даємо запас 10 секунд.
   */
  return Math.abs(lastSignIn - created) <= 10_000;
}

export async function GET(request: Request) {
  const { searchParams } =
    new URL(request.url);

  const code =
    searchParams.get("code");

  let next =
    searchParams.get("next") ??
    "/dashboard";

  if (!next.startsWith("/")) {
    next = "/dashboard";
  }

  if (!code) {
    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        "/login?error=oauth",
      ),
    );
  }

  const supabase =
    await createClient();

  const { data, error } =
    await supabase.auth.exchangeCodeForSession(
      code,
    );

  if (error) {
    console.error(
      "GOOGLE OAUTH CODE EXCHANGE ERROR:",
      error,
    );

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        "/login?error=oauth",
      ),
    );
  }

  const user =
    data.session?.user;

  if (
    user &&
    isNewOAuthUser(
      user.created_at,
      user.last_sign_in_at,
    )
  ) {
    const params =
      new URLSearchParams({
        next,
      });

    return NextResponse.redirect(
      buildRedirectUrl(
        request,
        `/auth/complete?${params.toString()}`,
      ),
    );
  }

  return NextResponse.redirect(
    buildRedirectUrl(
      request,
      next,
    ),
  );
}
