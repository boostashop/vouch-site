import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"

export const alt = "VouchSite Profile"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      name: true,
      profileAccentColor: true,
      vouchesReceived: { select: { rating: true } },
    },
  })

  const accent = user?.profileAccentColor || "#6366f1"
  const name = user?.name || slug
  const vouchCount = user?.vouchesReceived.length ?? 0
  const avgRating =
    vouchCount > 0
      ? (user!.vouchesReceived.reduce((a, v) => a + v.rating, 0) / vouchCount).toFixed(1)
      : null

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
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
            top: -200,
            left: -150,
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: accent,
            opacity: 0.15,
            filter: "blur(80px)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 80px",
            height: "100%",
          }}
        >
          {/* Top: branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: accent,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 900,
                fontSize: 20,
              }}
            >
              V
            </div>
            <span style={{ color: "#71717a", fontSize: 18, fontWeight: 700, letterSpacing: "0.1em" }}>
              VOUCHSITE
            </span>
          </div>

          {/* Middle: name + stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                fontSize: 72,
                fontWeight: 900,
                color: "#ffffff",
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {name}
            </div>

            <div style={{ display: "flex", gap: 24 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 28px",
                  gap: 4,
                }}
              >
                <span style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }}>
                  VOUCHES
                </span>
                <span style={{ color: "#ffffff", fontSize: 36, fontWeight: 900 }}>{vouchCount}</span>
              </div>

              {avgRating && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    borderRadius: 16,
                    padding: "16px 28px",
                    gap: 4,
                  }}
                >
                  <span style={{ color: "#78716c", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }}>
                    AVG RATING
                  </span>
                  <span style={{ color: "#f59e0b", fontSize: 36, fontWeight: 900 }}>
                    ★ {avgRating}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 28px",
                  gap: 4,
                }}
              >
                <span style={{ color: "#71717a", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em" }}>
                  STATUS
                </span>
                <span style={{ color: "#10b981", fontSize: 20, fontWeight: 900 }}>✓ Verified</span>
              </div>
            </div>
          </div>

          {/* Bottom: accent bar */}
          <div
            style={{
              height: 4,
              width: "100%",
              background: `linear-gradient(to right, ${accent}, transparent)`,
              borderRadius: 4,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  )
}
