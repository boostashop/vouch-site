import { createHmac } from "crypto"

const SECRET = process.env.DOWNLOAD_TOKEN_SECRET
const FILES_BASE_URL = process.env.FILES_BASE_URL || process.env.R2_PUBLIC_URL

export function generateDownloadToken(key: string, expiresInSeconds = 3600): string {
  if (!SECRET) return ""
  const intervalMs = 1800 * 1000 // 30 minutes
  const roundedTime = Math.floor(Date.now() / intervalMs) * intervalMs
  const payload = { key, exp: roundedTime + expiresInSeconds * 1000 }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = createHmac("sha256", SECRET).update(payloadB64).digest("hex")
  return `${payloadB64}.${sig}`
}

export function getSignedProofUrl(proofImageUrl: string | null): string | null {
  if (!proofImageUrl) return null
  
  // If it's already signed, return it as-is
  if (proofImageUrl.includes("?t=") && proofImageUrl.includes("&k=")) {
    return proofImageUrl
  }

  // Extract relative key from URL if it starts with files base URL, public URL, or files.vouched.to
  let key = proofImageUrl
  const baseUrls = [
    FILES_BASE_URL,
    process.env.R2_PUBLIC_URL,
    "https://files.vouched.to"
  ].filter(Boolean) as string[]

  for (const baseUrl of baseUrls) {
    if (proofImageUrl.startsWith(baseUrl)) {
      const cleanBase = baseUrl.replace(/\/$/, "")
      key = proofImageUrl.slice(cleanBase.length)
      if (key.startsWith("/")) {
        key = key.slice(1)
      }
      break
    }
  }

  // If it is an external URL (not starting with proofs/), return as-is
  if (!key.startsWith("proofs/") && (proofImageUrl.startsWith("http://") || proofImageUrl.startsWith("https://"))) {
    return proofImageUrl
  }

  // Generate signed token
  const token = generateDownloadToken(key, 3600)
  if (!token) return proofImageUrl // fallback to raw URL if secret not configured

  const cleanFilesBaseUrl = (FILES_BASE_URL || "https://files.vouched.to").replace(/\/$/, "")
  return `${cleanFilesBaseUrl}/dl?t=${token}&k=${encodeURIComponent(key)}`
}
