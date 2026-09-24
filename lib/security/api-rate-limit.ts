import type { SupabaseClient } from "@supabase/supabase-js";

type RateLimitResult = {
  allowed: boolean;
  requestCount: number;
  remaining: number;
  retryAfterSeconds: number;
};

type RateLimitRpcRow = {
  allowed: boolean;
  request_count: number;
  remaining: number;
  retry_after_seconds: number;
};

export async function consumeApiRateLimit(
  supabase: SupabaseClient,
  options: {
    bucket: string;
    limit: number;
    windowSeconds: number;
  },
): Promise<RateLimitResult> {
  const { data, error } = await supabase.rpc("consume_api_rate_limit", {
    p_bucket: options.bucket,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    throw new Error(`Rate limit RPC failed: ${error.message}`);
  }

  const row = (data as RateLimitRpcRow[] | null)?.[0];

  if (!row) {
    throw new Error("Rate limit RPC returned no result.");
  }

  return {
    allowed: row.allowed,
    requestCount: row.request_count,
    remaining: row.remaining,
    retryAfterSeconds: row.retry_after_seconds,
  };
}
