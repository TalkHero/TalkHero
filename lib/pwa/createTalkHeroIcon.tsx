import { ImageResponse } from "next/og";

type CreateTalkHeroIconOptions = {
  size: number;
  maskable?: boolean;
};

export function createTalkHeroIcon({
  size,
  maskable = false,
}: CreateTalkHeroIconOptions): ImageResponse {
  const safeInset = maskable
    ? Math.round(size * 0.16)
    : Math.round(size * 0.08);

  const wordmarkSize = Math.round(size * 0.18);
  const radius = Math.round(size * 0.22);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: safeInset,
        borderRadius: radius,
        background:
          "linear-gradient(135deg, #4F46E5 0%, #2563EB 58%, #0F172A 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: wordmarkSize,
          fontWeight: 800,
          letterSpacing: "-0.06em",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
          }}
        >
          Talk
        </span>

        <span
          style={{
            color: "#BFDBFE",
          }}
        >
          Hero
        </span>
      </div>
    </div>,
    {
      width: size,
      height: size,
    },
  );
}
