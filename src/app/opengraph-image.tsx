import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#f6f3ec",
          color: "#221f1a",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 26,
            fontFamily: "monospace",
            letterSpacing: 3,
            textTransform: "uppercase",
            color: "#2f4a34",
            marginBottom: 28,
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: 999, background: "#7a4318", display: "flex" }} />
          For landscaping &amp; hardscaping companies
        </div>
        <div style={{ display: "flex", fontSize: 68, lineHeight: 1.08, maxWidth: 980 }}>
          From walkthrough to a designed, priced proposal — before you leave the truck.
        </div>
        <div style={{ display: "flex", fontSize: 30, marginTop: 40, fontFamily: "monospace", color: "#6b6255" }}>
          GroundWork
        </div>
      </div>
    ),
    { ...size }
  );
}
