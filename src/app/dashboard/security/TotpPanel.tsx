"use client"

import { useState } from "react"
import { ShieldCheck, ShieldOff, QrCode, KeyRound, Copy, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react"
import { initiateTotpSetup, confirmTotpSetup, disableTotp } from "./actions"

type View = "idle" | "setup_qr" | "disabling"

export function TotpPanel({ totpEnabled: initial }: { totpEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initial)
  const [view, setView] = useState<View>("idle")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [code, setCode] = useState("")

  const reset = () => {
    setView("idle"); setError(null); setCode(""); setQrDataUrl(null); setManualCode(null)
  }

  const handleStartSetup = async () => {
    setLoading(true); setError(null); setSuccess(null)
    const result = await initiateTotpSetup()
    setLoading(false)
    if ("error" in result && result.error) { setError(result.error); return }
    setQrDataUrl(result.qrDataUrl!)
    setManualCode(result.manualCode!)
    setView("setup_qr")
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const result = await confirmTotpSetup(code)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setEnabled(true)
    setSuccess("2FA enabled — your account is now protected.")
    reset()
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(null)
    const result = await disableTotp(code)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    setEnabled(false)
    setSuccess("2FA disabled.")
    reset()
  }

  const copyCode = () => {
    if (manualCode) {
      navigator.clipboard.writeText(manualCode.replace(/\s/g, ""))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Status row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${enabled ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-zinc-400 dark:bg-zinc-600"}`} />
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">
            {enabled ? "Enabled" : "Disabled"}
          </span>
          {enabled && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              Active
            </span>
          )}
        </div>
        {view === "idle" && (
          enabled ? (
            <button
              onClick={() => { setView("disabling"); setError(null); setSuccess(null) }}
              className="text-xs font-bold text-zinc-500 hover:text-red-500 transition-colors"
            >
              Disable 2FA
            </button>
          ) : (
            <button
              onClick={handleStartSetup}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              {loading ? "Loading..." : (<><ShieldCheck size={14} /> Enable 2FA</>)}
            </button>
          )
        )}
      </div>

      {/* Success banner */}
      {success && view === "idle" && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-sm font-medium animate-in fade-in duration-300">
          <CheckCircle size={16} className="flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Setup: QR code + verify */}
      {view === "setup_qr" && (
        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <QrCode size={16} />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">Scan with your authenticator app</p>
                <p className="text-xs text-zinc-500 mt-0.5">Works with Authy, Google Authenticator, Microsoft Authenticator, and any TOTP app.</p>
              </div>
            </div>

            {qrDataUrl && (
              <div className="flex justify-center">
                <div className="p-3 bg-white rounded-2xl border border-zinc-200 dark:border-white/10 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrDataUrl} alt="2FA QR Code" width={160} height={160} className="rounded-lg" />
                </div>
              </div>
            )}

            {manualCode && (
              <div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  <KeyRound size={10} className="inline mr-1" />
                  Can&apos;t scan? Enter this code manually
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 font-mono text-xs bg-zinc-100 dark:bg-black px-4 py-3 rounded-xl text-zinc-900 dark:text-zinc-300 tracking-widest border border-zinc-200 dark:border-white/5 select-all">
                    {manualCode}
                  </code>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all border border-zinc-200 dark:border-white/5"
                  >
                    {copied ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleConfirm} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <AlertTriangle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Verify — enter the 6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                maxLength={7}
                placeholder="000 000"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                autoComplete="one-time-code"
                required
                className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={reset}
                className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || code.replace(/\s/g, "").length < 6}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
              >
                {loading ? "Verifying…" : (<>Confirm & Enable <ArrowRight size={14} /></>)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disable flow */}
      {view === "disabling" && (
        <form onSubmit={handleDisable} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
              Disabling 2FA will make your account less secure. Enter your current authenticator code to confirm.
            </p>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertTriangle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Current 6-digit code</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9 ]*"
              maxLength={7}
              placeholder="000 000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              autoComplete="one-time-code"
              required
              className="w-full bg-white dark:bg-black border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={reset}
              className="flex-1 py-3 rounded-xl border border-zinc-200 dark:border-white/10 text-sm font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || code.replace(/\s/g, "").length < 6}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-red-500/20"
            >
              {loading ? "Verifying…" : "Disable 2FA"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
