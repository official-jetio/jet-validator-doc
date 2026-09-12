import { ImageResponse } from "next/og";

export const alt =
  "@jetio/validator — JSON Schema compiled to fast validation functions";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f0f14",
          color: "#f5f5f7",
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 26,
            color: "#9b93d6",
          }}
        >
          JSON Schema validator
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            @jetio/validator
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              fontSize: 34,
              color: "#b8b8c4",
              maxWidth: 940,
              lineHeight: 1.3,
            }}
          >
            JSON Schema compiled to fast validation functions.
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: "#e6e6ee" }}>
          <Stat color="#8b7dff" label="~14x faster compile" />
          <Stat color="#35c684" label="99%+ compliant" />
          <Stat color="#f2a24a" label="zero-runtime standalone" />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginRight: 44 }}>
      <div
        style={{
          display: "flex",
          width: 12,
          height: 12,
          borderRadius: 6,
          background: color,
          marginRight: 12,
        }}
      />
      {label}
    </div>
  );
}
