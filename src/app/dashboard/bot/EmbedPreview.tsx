"use client"

interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

interface EmbedPreviewProps {
  color: string
  title: string
  titleUrl?: string
  description?: string
  authorName?: string
  authorIconUrl?: string
  thumbnailUrl?: string
  footerText: string
  footerIconUrl?: string
  showTimestamp?: boolean
  fields?: EmbedField[]
  imageUrl?: string
}

function formatTimestamp() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export function EmbedPreview({
  color,
  title,
  titleUrl,
  description,
  authorName,
  authorIconUrl,
  thumbnailUrl,
  footerText,
  footerIconUrl,
  showTimestamp = true,
  fields = [],
  imageUrl,
}: EmbedPreviewProps) {
  const inlineFields = fields.filter((f) => f.inline)
  const blockFields = fields.filter((f) => !f.inline)

  return (
    <div className="rounded-[4px] overflow-hidden max-w-[432px] font-sans" style={{ background: "#2b2d31" }}>
      <div className="flex" style={{ borderLeft: `4px solid ${color || "#5865f2"}` }}>
        <div className="flex-1 px-4 py-3 min-w-0 space-y-1.5">
          {/* Author */}
          {authorName && (
            <div className="flex items-center gap-1.5 mt-0.5">
              {authorIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={authorIconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              )}
              <span className="text-[13px] font-semibold" style={{ color: "#dbdee1" }}>
                {authorName}
              </span>
            </div>
          )}

          {/* Title */}
          {title && (
            titleUrl ? (
              <a
                href={titleUrl}
                className="block text-[15px] font-semibold leading-snug hover:underline"
                style={{ color: "#00aafc" }}
              >
                {title}
              </a>
            ) : (
              <p className="text-[15px] font-semibold leading-snug" style={{ color: "#f2f3f5" }}>
                {title}
              </p>
            )
          )}

          {/* Description */}
          {description && (
            <p className="text-[14px] leading-snug whitespace-pre-wrap" style={{ color: "#dbdee1" }}>
              {description}
            </p>
          )}

          {/* Block fields */}
          {blockFields.map((f, i) => (
            <div key={i} className="mt-2">
              <p className="text-[12px] font-semibold mb-0.5" style={{ color: "#f2f3f5" }}>{f.name}</p>
              <p className="text-[13px]" style={{ color: "#dbdee1" }}>{f.value}</p>
            </div>
          ))}

          {/* Inline fields */}
          {inlineFields.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
              {inlineFields.map((f, i) => (
                <div key={i} className="min-w-[60px]">
                  <p className="text-[12px] font-semibold mb-0.5" style={{ color: "#f2f3f5" }}>{f.name}</p>
                  <p className="text-[13px]" style={{ color: "#dbdee1" }}>{f.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Large image */}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="mt-3 rounded-[4px] max-w-full max-h-48 object-cover" />
          )}

          {/* Footer */}
          {(footerText || showTimestamp) && (
            <div className="flex items-center gap-1.5 pt-1">
              {footerIconUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={footerIconUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
              )}
              <span className="text-[11px]" style={{ color: "#949ba4" }}>
                {footerText}
                {footerText && showTimestamp && " • "}
                {showTimestamp && formatTimestamp()}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnail */}
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="w-16 h-16 rounded-[4px] object-cover m-3 flex-shrink-0 self-start"
          />
        )}
      </div>
    </div>
  )
}
