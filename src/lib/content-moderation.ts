// Keyword-based illegal content detection for vouch comments.
// Returns the first matching flag, or null if the text looks clean.
// Deliberately conservative — high-confidence matches only — to minimise
// false positives on legitimate transaction vouches.

export interface ContentFlag {
  category: string
  label: string
  match: string
}

type Rule = { category: string; label: string; pattern: RegExp }

const RULES: Rule[] = [
  {
    category: "drugs",
    label: "Drug sales / distribution",
    pattern:
      /\b(heroin|fentanyl|cocaine|crack rock|methamphetamine|crystal meth|meth dealer|mdma|ecstasy pills|molly pills|ketamine|lsd tabs?|drug deal|drug plug|sells? drugs?|drug lord)\b/i,
  },
  {
    category: "weapons",
    label: "Illegal weapons",
    pattern:
      /\b(ghost gun|untraceable (gun|weapon|pistol|firearm)|unserialized (gun|firearm)|auto sear|giggle switch|glock switch|full.?auto conversion|illegal (suppressor|silencer))\b/i,
  },
  {
    category: "illegal_services",
    label: "Illegal services",
    pattern:
      /\b(ddos (attack|service|for hire)|doxing service|doxxing service|swatting service|stolen (credit card|debit card|cc)|cc dump|fullz|fake (passport|id card|driver.?s licen[cs]e)|hitman|murder for hire|hire to kill|assassination service)\b/i,
  },
  {
    category: "csam",
    label: "Child sexual exploitation material",
    pattern:
      /\b(child (porn|pornography|exploitation material|abuse material)|csam|loli(con)? (seller|shop|content)|shota (seller|content))\b/i,
  },
  {
    category: "trafficking",
    label: "Human trafficking",
    pattern:
      /\b(human trafficking|sex trafficking|sells? (people|humans|girls|boys) for (sex|work)|slave (trade|market|auction))\b/i,
  },
]

export function checkIllegalContent(text: string): ContentFlag | null {
  if (!text) return null
  for (const rule of RULES) {
    const m = rule.pattern.exec(text)
    if (m) {
      return { category: rule.category, label: rule.label, match: m[0] }
    }
  }
  return null
}
