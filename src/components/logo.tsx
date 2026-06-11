// Brand mark for Vouched.to: a checkmark drawn to read as the letter "V"
// (V for Vouched, check for verified) on an indigo gradient tile.
// Canonical art also lives in src/app/icon.svg and public/logo.svg; the
// raster assets (favicon.ico, apple-icon.png, public/logo.png) are rendered
// from the same geometry by scratch/render_logo.py.

type Tone = "indigo" | "red";

const GRADIENTS: Record<Tone, [string, string]> = {
  indigo: ["#6366f1", "#4338ca"],
  red: ["#ef4444", "#b91c1c"],
};

export function LogoMark({
  size = 32,
  tone = "indigo",
  className,
}: {
  size?: number;
  tone?: Tone;
  className?: string;
}) {
  const [from, to] = GRADIENTS[tone];
  const gid = `vmark-${tone}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor={from} />
          <stop offset="1" stopColor={to} />
        </linearGradient>
        <linearGradient id="vmark-sheen" x1="32" y1="0" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill={`url(#${gid})`} />
      <rect width="64" height="64" rx="15" fill="url(#vmark-sheen)" />
      <path
        d="M18 26.5L28.5 45L46.5 20"
        stroke="#fff"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
