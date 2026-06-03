import { test } from "node:test"
import assert from "node:assert/strict"
import { sanitizeStyleContent, configToCSS, defaultDarkConfig } from "./design-tokens"

test("sanitizeStyleContent strips the </style breakout sequence", () => {
  const out = sanitizeStyleContent("a{}</style><script>x</script>")
  assert.equal(/<\/style/i.test(out), false)
})

test("configToCSS neutralizes a customCSS breakout attempt (case-insensitive)", () => {
  const css = configToCSS({ ...defaultDarkConfig, customCSS: "</STYLE><script>evil()</script>" })
  assert.equal(/<\/style/i.test(css), false)
})

test("configToCSS still emits the expected profile selectors", () => {
  const css = configToCSS(defaultDarkConfig)
  assert.match(css, /#vp \.vc-name/)
  assert.match(css, /#vp \.vc-card/)
})
