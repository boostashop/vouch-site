import { test } from "node:test"
import assert from "node:assert/strict"
import { sanitizeStyleContent, configToCSS, sanitizeConfig, defaultDarkConfig } from "./design-tokens"

test("sanitizeStyleContent strips the </style breakout sequence", () => {
  const out = sanitizeStyleContent("a{}</style><script>x</script>")
  assert.equal(/<\/style/i.test(out), false)
})

test("configToCSS neutralizes a </style breakout smuggled into a token value", () => {
  const css = configToCSS({ ...defaultDarkConfig, nameColor: "red</STYLE><script>evil()</script>" })
  assert.equal(/<\/style/i.test(css), false)
})

test("configToCSS still emits the expected profile selectors", () => {
  const css = configToCSS(defaultDarkConfig)
  assert.match(css, /#vp \.vc-name/)
  assert.match(css, /#vp \.vc-card/)
})

test("sanitizeConfig rejects CSS-injection color values, keeps valid ones", () => {
  const clean = sanitizeConfig(
    {
      ...defaultDarkConfig,
      nameColor: "red;background:url(https://evil.example/x)",
      cardBg: "url(https://evil.example/beacon.png)",
      ctaBg: "#ff0000",
      ratingBg: "rgba(245,158,11,0.1)",
    },
    defaultDarkConfig,
  )
  assert.equal(clean.nameColor, defaultDarkConfig.nameColor)
  assert.equal(clean.cardBg, defaultDarkConfig.cardBg)
  assert.equal(clean.ctaBg, "#ff0000")
  assert.equal(clean.ratingBg, "rgba(245,158,11,0.1)")
})

test("sanitizeConfig clamps numbers and falls back on junk", () => {
  const clean = sanitizeConfig(
    {
      ...defaultDarkConfig,
      nameFontSize: 9001,
      cardPadding: -5,
      glowIntensity: "30; position:fixed" as unknown as number,
      pageBgType: "evil" as unknown as "solid",
    },
    defaultDarkConfig,
  )
  assert.equal(clean.nameFontSize, 72)
  assert.equal(clean.cardPadding, 0.75)
  assert.equal(clean.glowIntensity, defaultDarkConfig.glowIntensity)
  assert.equal(clean.pageBgType, defaultDarkConfig.pageBgType)
})

test("sanitizeConfig returns full defaults for null/garbage input", () => {
  assert.deepEqual(sanitizeConfig(null, defaultDarkConfig), defaultDarkConfig)
  assert.deepEqual(sanitizeConfig("garbage", defaultDarkConfig), defaultDarkConfig)
})
