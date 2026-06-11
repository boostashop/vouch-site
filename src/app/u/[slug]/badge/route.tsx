import { ImageResponse } from "next/og"
import { prisma } from "@/lib/prisma"
import { hasActivePremium } from "@/lib/premium"
import { standingLabel } from "@/lib/reputation"

// Embeddable reputation badge — a live PNG people drop into forum signatures,
// marketplace listings, etc. It is public and hotlinked from third-party sites,
// so it must always return an image (never an error page) and carry a short
// cache window so the numbers stay reasonably fresh.
//
//   /u/<slug>/badge            → wide signature banner (default)
//   /u/<slug>/badge?size=chip  → compact shields-style chip
//
// Real stats are a premium perk. Free users (and unknown slugs) get an "upgrade"
// promo image instead — nothing looks broken, and it doubles as marketing.

type Size = "banner" | "chip"

const DIMENSIONS: Record<Size, { width: number; height: number }> = {
  banner: { width: 560, height: 140 },
  chip: { width: 285, height: 50 },
}

// Forum image proxies cache aggressively; this is the freshness ceiling we ask
// for. ~5 min live, served stale for another 10 while we revalidate.
const CACHE_CONTROL = "public, max-age=300, s-maxage=300, stale-while-revalidate=600"

function imageResponse(element: React.ReactElement, size: Size) {
  return new ImageResponse(element, {
    ...DIMENSIONS[size],
    headers: { "cache-control": CACHE_CONTROL },
  })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const sizeParam = new URL(request.url).searchParams.get("size")
  const size: Size = sizeParam === "chip" ? "chip" : "banner"

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      isPremium: true,
      premiumExpiresAt: true,
      profileAccentColor: true,
    },
  })

  // Unknown slug or non-premium account → show the promo badge.
  if (!user || !hasActivePremium(user)) {
    return imageResponse(<Promo size={size} />, size)
  }

  const [vouchCount, ratingAgg] = await Promise.all([
    prisma.vouch.count({ where: { receiverId: user.id } }),
    prisma.vouch.aggregate({ where: { receiverId: user.id }, _avg: { rating: true } }),
  ])
  const avgRating = ratingAgg._avg.rating != null ? ratingAgg._avg.rating.toFixed(1) : null
  const accent = sanitizeColor(user.profileAccentColor) || "#6366f1"
  const name = user.name || slug

  return imageResponse(
    size === "chip" ? (
      <Chip name={name} accent={accent} vouchCount={vouchCount} avgRating={avgRating} />
    ) : (
      <Banner name={name} accent={accent} vouchCount={vouchCount} avgRating={avgRating} />
    ),
    size,
  )
}

// Only allow simple hex colors through into inline styles; fall back otherwise.
function sanitizeColor(value: string | null): string | null {
  if (value && /^#[0-9a-fA-F]{6}$/.test(value)) return value
  return null
}

const BG = "#09090b"
const SUBTLE = "#71717a"

interface BadgeProps {
  name: string
  accent: string
  vouchCount: number
  avgRating: string | null
}

function Banner({ name, accent, vouchCount, avgRating }: BadgeProps) {
  const initial = (name[0] || "V").toUpperCase()
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BG,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Accent glow */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: accent,
          opacity: 0.18,
        }}
      />
      {/* Left accent stripe */}
      <div style={{ display: "flex", width: 6, height: "100%", background: accent }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: "0 26px 0 22px",
        }}
      >
        {/* Avatar initial */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: accent,
            color: "#fff",
            fontSize: 30,
            fontWeight: 900,
          }}
        >
          {initial}
        </div>

        {/* Name + status */}
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 20, flex: 1 }}>
          <div
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              maxWidth: 230,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 8 }}>
            <div style={{ display: "flex", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <span style={{ color: "#10b981", fontSize: 14, fontWeight: 900, marginLeft: 6 }}>Verified</span>
            <span style={{ color: SUBTLE, fontSize: 14, margin: "0 8px" }}>·</span>
            <span style={{ color: SUBTLE, fontSize: 14, fontWeight: 700 }}>
              {standingLabel(vouchCount)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span style={{ color: "#fff", fontSize: 34, fontWeight: 900 }}>{vouchCount}</span>
            <span
              style={{
                color: SUBTLE,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.14em",
                marginLeft: 7,
              }}
            >
              VOUCHES
            </span>
          </div>
          {avgRating && (
            <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
              <span style={{ color: "#f59e0b", fontSize: 16, fontWeight: 900 }}>⭐ {avgRating}</span>
              <span
                style={{
                  color: "#52525b",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.1em",
                  marginLeft: 8,
                }}
              >
                VOUCHED.TO
              </span>
            </div>
          )}
          {!avgRating && (
            <span
              style={{
                color: "#52525b",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.1em",
                marginTop: 6,
              }}
            >
              VOUCHED.TO
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function Chip({ accent, vouchCount, avgRating }: BadgeProps) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: BG,
        fontFamily: "sans-serif",
        padding: "0 14px",
        borderRadius: 8,
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: 7,
          background: accent,
        }}
      >
        <svg width="19" height="19" viewBox="0 0 64 64" fill="none">
          <path
            d="M18 26.5L28.5 45L46.5 20"
            stroke="#fff"
            strokeWidth="7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 800, marginLeft: 8 }}>vouched</span>
      <div style={{ display: "flex", width: 1, height: 20, background: "#27272a", margin: "0 10px" }} />
      <span style={{ color: "#fff", fontSize: 14, fontWeight: 900 }}>{vouchCount}</span>
      {avgRating && (
        <span style={{ color: "#f59e0b", fontSize: 13, fontWeight: 900, marginLeft: 9 }}>
          ⭐ {avgRating}
        </span>
      )}
      <div
        style={{ display: "flex", width: 8, height: 8, borderRadius: "50%", background: "#10b981", marginLeft: 10 }}
      />
      <span style={{ color: "#10b981", fontSize: 13, fontWeight: 900, marginLeft: 6 }}>Verified</span>
    </div>
  )
}

function Promo({ size }: { size: Size }) {
  if (size === "chip") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG,
          fontFamily: "sans-serif",
          borderRadius: 8,
        }}
      >
        <span style={{ color: "#a1a1aa", fontSize: 13, fontWeight: 800 }}>🔒 vouched.to</span>
      </div>
    )
  }
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        background: BG,
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "#6366f1",
          opacity: 0.18,
        }}
      />
      <div style={{ display: "flex", width: 6, height: "100%", background: "#6366f1" }} />
      <div style={{ display: "flex", alignItems: "center", padding: "0 26px 0 22px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "rgba(255,255,255,0.05)",
            fontSize: 30,
          }}
        >
          🔒
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 20 }}>
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em" }}>
            Get your verified vouch badge
          </span>
          <span style={{ color: SUBTLE, fontSize: 15, fontWeight: 700, marginTop: 6 }}>
            Build trusted reputation → vouched.to
          </span>
        </div>
      </div>
    </div>
  )
}
