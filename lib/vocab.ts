function normalizeAnswer(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,!?;:'"«»""''`]/g, '')
    .replace(/\s+/g, ' ')
}

// Accepts Cyrillic answer or Latin transliteration
export function matchesAnswer(input: string, bg: string, cyr?: string): boolean {
  const normInput = normalizeAnswer(input)
  const bgAlts = bg.split('/').map(s => normalizeAnswer(s.trim()))
  if (bgAlts.some(alt => normInput === alt)) return true
  if (cyr) {
    const cyrAlts = cyr.split('/').map(s => normalizeAnswer(s.trim()))
    if (cyrAlts.some(alt => normInput === alt)) return true
  }
  return false
}

export function matchesEnAnswer(input: string, en: string): boolean {
  const normInput = normalizeAnswer(input)
  const alts = en.split('/').map(s => normalizeAnswer(s.trim()))
  return alts.some(alt => normInput === alt)
}
