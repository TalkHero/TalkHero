export type AnalyticsEventName =
  | "sign_up"
  | "login"
  | "placement_test_completed"
  | "speaking_completed"
  | "quest_completed"
  | "vocabulary_word_learned";

type AnalyticsEventParams = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(
  event: AnalyticsEventName,
  params: AnalyticsEventParams = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dataLayer = window.dataLayer ?? [];

  window.dataLayer.push({
    event,
    ...params,
  });
}
