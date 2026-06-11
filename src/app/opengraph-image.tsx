import { ImageResponse } from "next/og"

export const alt = "Vouched.to — Secure Your Reputation"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#09090b",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "radial-gradient(circle at 50% 28%, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.08) 35%, rgba(9,9,11,0) 65%)",
            display: "flex",
          }}
        />

        {/* Logo tile */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "linear-gradient(135deg, #6366f1, #4338ca)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(79,70,229,0.45)",
          }}
        >
          <svg width="88" height="88" viewBox="0 0 64 64" fill="none">
            <path
              d="M18 26.5L28.5 45L46.5 20"
              stroke="#fff"
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div
          style={{
            marginTop: 44,
            fontSize: 76,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            display: "flex",
          }}
        >
          Vouched.to
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 28,
            fontWeight: 600,
            color: "#a1a1aa",
            display: "flex",
          }}
        >
          The ultimate insurance policy for your reputation
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            height: 6,
            width: "100%",
            background: "linear-gradient(to right, #6366f1, #4338ca, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
