import crypto from "crypto"

// AES-256-GCM encryption for secrets at rest (currently bot tokens). The key is
// derived from TOKEN_ENCRYPTION_KEY via SHA-256, so any sufficiently random
// string works as the env value. Stored format:
//
//   enc:v1:<iv>:<authTag>:<ciphertext>   (each segment base64)
//
// Values without the `enc:v1:` prefix are treated as legacy plaintext and
// returned untouched on decrypt, so rows written before encryption was added
// keep working until they're next saved (which re-encrypts them).

const PREFIX = "enc:v1:"

function getKey(): Buffer {
  const secret = process.env.TOKEN_ENCRYPTION_KEY
  if (!secret) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set; refusing to encrypt/decrypt secrets.",
    )
  }
  return crypto.createHash("sha256").update(secret).digest()
}

export function encryptSecret(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return PREFIX + [iv, tag, ciphertext].map((b) => b.toString("base64")).join(":")
}

export function isEncrypted(stored: string | null | undefined): boolean {
  return !!stored && stored.startsWith(PREFIX)
}

export function decryptSecret(stored: string): string {
  if (!stored.startsWith(PREFIX)) return stored // legacy plaintext
  const [ivB64, tagB64, dataB64] = stored.slice(PREFIX.length).split(":")
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    getKey(),
    Buffer.from(ivB64, "base64"),
  )
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8")
}

// Tolerant variant for read paths that must not crash on a corrupt/undecryptable
// value (e.g. the bot sync loop iterating every user). Returns null on failure.
export function tryDecryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null
  try {
    return decryptSecret(stored)
  } catch {
    return null
  }
}
