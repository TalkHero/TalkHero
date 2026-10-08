import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

type AnonymousRateLimitResult = {
  allowed: boolean;
  requestCount: number;
  remaining: number;
  retryAfterSeconds: number;
};

type AnonymousRateLimitRpcRow = {
  allowed: boolean;
  request_count: number;
  remaining: number;
  retry_after_seconds: number;
};

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();

  if (clientIp && isIP(clientIp)) {
    return clientIp;
  }

  return "unknown";
}

export async function consumeAnonymousApiRateLimit(
  request: Request,
  options: {
    bucket: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<AnonymousRateLimitResult> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for anonymous rate limiting.",
    );
  }

  const clientIp = getClientIp(request);

  const identifierHash = createHmac("sha256", secret)
    .update(`${options.bucket}:${clientIp}`)
    .digest("hex");

  const admin = createAdminClient() as SupabaseClient;

  const { data, error } = await admin.rpc(
    "consume_anonymous_api_rate_limit",
    {
      p_identifier_hash: identifierHash,
      p_bucket: options.bucket,
      p_limit: options.limit,
      p_window_seconds: options.windowSeconds,
    },
  );

  if (error) {
    throw new Error(
      `Anonymous rate limit RPC failed: ${error.message}`,
    );
  }

  const row =
    (data as AnonymousRateLimitRpcRow[] | null)?.[0];

  if (!row) {
    throw new Error(
      "Anonymous rate limit RPC returned no result.",
    );
  }

  return {
    allowed: row.allowed,
    requestCount: row.request_count,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after_seconds,
  };
}