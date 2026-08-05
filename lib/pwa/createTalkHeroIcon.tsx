import { ImageResponse } from "next/og";

type CreateTalkHeroIconOptions = {
  size: number;
  maskable?: boolean;
};

export function createTalkHeroIcon({
  size,
  maskable = false,
}: CreateTalkHeroIconOptions): ImageResponse {
  const horizontalInset = Math.round(size * (maskable ? 0.2 : 0.12));

  const verticalInset = Math.round(size * (maskable ? 0.2 : 0.12));

  const wordmarkSize = Math.round(size * (maskable ? 0.145 : 0.155));

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: `${verticalInset}px ${horizontalInset}px`,
        background:
          "linear-gradient(135deg, #4F46E5 0%, #2563EB 58%, #172554 100%)",
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
          letterSpacing: "-0.055em",
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
