#!/usr/bin/env python3
"""Render the Vouched.to V-check logo to PNG/ICO assets.

Pure-stdlib SDF rasterizer (no PIL/ImageMagick on this box). Geometry matches
src/app/icon.svg: 64x64 viewBox, rx=15 tile, indigo gradient #6366f1->#4338ca,
vertical white sheen, white check stroke M18 26.5 L28.5 45 L46.5 20, width 7.5.

Outputs:
  public/logo.png        512px, rounded, transparent corners
  src/app/apple-icon.png 180px, full-bleed square (iOS applies its own mask)
  src/app/favicon.ico    16/32/48 PNG-compressed entries
"""
import math
import struct
import zlib

GRAD_FROM = (0x63, 0x66, 0xF1)
GRAD_TO = (0x43, 0x38, 0xCA)
CHECK = [(18.0, 26.5), (28.5, 45.0), (46.5, 20.0)]
STROKE_W = 7.5
TILE_RX = 15.0


def sd_round_rect(x, y, size, r):
    h = size / 2.0
    qx = abs(x - h) - (h - r)
    qy = abs(y - h) - (h - r)
    return math.hypot(max(qx, 0.0), max(qy, 0.0)) + min(max(qx, qy), 0.0) - r


def sd_segment(x, y, ax, ay, bx, by):
    vx, vy = bx - ax, by - ay
    wx, wy = x - ax, y - ay
    t = (wx * vx + wy * vy) / (vx * vx + vy * vy)
    t = max(0.0, min(1.0, t))
    return math.hypot(wx - t * vx, wy - t * vy)


def render(size, rounded=True, ss=3):
    scale = size / 64.0
    rx = TILE_RX * scale
    half_w = STROKE_W * scale / 2.0
    pts = [(px * scale, py * scale) for px, py in CHECK]
    rows = []
    inv_ss2 = 1.0 / (ss * ss)
    for j in range(size):
        row = bytearray()
        for i in range(size):
            ra = ga = ba = aa = 0.0
            for sj in range(ss):
                y = j + (sj + 0.5) / ss
                for si in range(ss):
                    x = i + (si + 0.5) / ss
                    if rounded:
                        a = min(1.0, max(0.0, 0.5 - sd_round_rect(x, y, size, rx)))
                        if a <= 0.0:
                            continue
                    else:
                        a = 1.0
                    # diagonal gradient
                    t = (x + y) / (2.0 * size)
                    cr = GRAD_FROM[0] + (GRAD_TO[0] - GRAD_FROM[0]) * t
                    cg = GRAD_FROM[1] + (GRAD_TO[1] - GRAD_FROM[1]) * t
                    cb = GRAD_FROM[2] + (GRAD_TO[2] - GRAD_FROM[2]) * t
                    # top sheen
                    sheen = max(0.0, 0.16 * (1.0 - y / (size * 0.625)))
                    cr += (255.0 - cr) * sheen
                    cg += (255.0 - cg) * sheen
                    cb += (255.0 - cb) * sheen
                    # check stroke
                    d = min(
                        sd_segment(x, y, *pts[0], *pts[1]),
                        sd_segment(x, y, *pts[1], *pts[2]),
                    ) - half_w
                    c = min(1.0, max(0.0, 0.5 - d))
                    cr += (255.0 - cr) * c
                    cg += (255.0 - cg) * c
                    cb += (255.0 - cb) * c
                    ra += cr * a
                    ga += cg * a
                    ba += cb * a
                    aa += a
            if aa > 0.0:
                # un-premultiply so PNG straight alpha is correct at edges
                row += bytes((
                    min(255, round(ra / aa)),
                    min(255, round(ga / aa)),
                    min(255, round(ba / aa)),
                    min(255, round(aa * inv_ss2 * 255.0)),
                ))
            else:
                row += b"\x00\x00\x00\x00"
        rows.append(bytes(row))
    return rows


def to_png(size, rows):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data))

    raw = b"".join(b"\x00" + r for r in rows)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def to_ico(entries):
    out = struct.pack("<HHH", 0, 1, len(entries))
    offset = 6 + 16 * len(entries)
    dir_part, data_part = b"", b""
    for size, png in entries:
        dir_part += struct.pack(
            "<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(png), offset
        )
        offset += len(png)
        data_part += png
    return out + dir_part + data_part


def main():
    root = "/home/ubuntu/vouches"
    with open(f"{root}/public/logo.png", "wb") as f:
        f.write(to_png(512, render(512)))
    print("logo.png done")
    with open(f"{root}/src/app/apple-icon.png", "wb") as f:
        f.write(to_png(180, render(180, rounded=False)))
    print("apple-icon.png done")
    ico_entries = [(s, to_png(s, render(s, ss=4))) for s in (16, 32, 48)]
    with open(f"{root}/src/app/favicon.ico", "wb") as f:
        f.write(to_ico(ico_entries))
    print("favicon.ico done")


if __name__ == "__main__":
    main()
