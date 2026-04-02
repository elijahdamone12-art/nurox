// TEKS tag format: grade.standard+letter  e.g. "5.3A", "7.12B", "10.1A"
const TEKS_TAG_RE = /^\d{1,2}\.[A-Z0-9]+[A-Z]$/;

export function normalizeStandardTag(tag: string): string {
  const normalized = tag.trim().toUpperCase();
  if (!TEKS_TAG_RE.test(normalized)) {
    throw new Error(`Invalid TEKS tag: "${tag}"`);
  }
  return normalized;
}

export function tryNormalizeStandardTag(tag: string): string | null {
  try {
    return normalizeStandardTag(tag);
  } catch {
    return null;
  }
}

export function normalizeStandardTags(tags: string[]): string[] {
  return tags.map((t) => tryNormalizeStandardTag(t)).filter((t): t is string => t !== null);
}
