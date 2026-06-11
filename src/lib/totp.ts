import crypto from "crypto"
import QRCode from "qrcode"

const ISSUER = "Vouched.to"
const DIGITS = 6
const PERIOD = 30
const WINDOW = 1 // ±1 step tolerance for clock drift

function base32Decode(input: string): Buffer {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  const str = input.toUpperCase().replace(/=+$/, "").replace(/\s/g, "")
  const out: number[] = []
  let bits = 0
  let val = 0
  for (const ch of str) {
    const idx = CHARS.indexOf(ch)
    if (idx < 0) continue
    val = (val << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((val >>> (bits - 8)) & 0xff)
      bits -= 8
    }
  }
  return Buffer.from(out)
}

function base32Encode(buf: Buffer): string {
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
  let result = ""
  let bits = 0
  let val = 0
  for (const byte of buf) {
    val = (val << 8) | byte
    bits += 8
    while (bits >= 5) {
      result += CHARS[(val >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) result += CHARS[(val << (5 - bits)) & 31]
  return result
}

function hotp(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const buf = Buffer.alloc(8)
  // Write counter as big-endian 64-bit integer
  let c = counter
  for (let i = 7; i >= 0; i--) {
    buf[i] = c & 0xff
    c = Math.floor(c / 256)
  }
  const hmac = crypto.createHmac("sha1", key).update(buf).digest()
  const offset = hmac[19] & 0xf
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    (hmac[offset + 1] << 16) |
    (hmac[offset + 2] << 8) |
    hmac[offset + 3]
  return String(code % 10 ** DIGITS).padStart(DIGITS, "0")
}

export function generateTotpSecret(): string {
  return base32Encode(crypto.randomBytes(20))
}

export function generateTotpUri(secret: string, accountName: string): string {
  const label = encodeURIComponent(`${ISSUER}:${accountName}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent(ISSUER)}&digits=${DIGITS}&period=${PERIOD}`
}

export async function generateQrDataUrl(uri: string): Promise<string> {
  return QRCode.toDataURL(uri, { margin: 1, width: 200 })
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const token = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(token)) return false
  const counter = Math.floor(Date.now() / 1000 / PERIOD)
  for (let i = -WINDOW; i <= WINDOW; i++) {
    if (hotp(secret, counter + i) === token) return true
  }
  return false
}

export function formatTotpSecret(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(" ") ?? secret
}
