// Shared validators + sanitizers for CV editor forms.
// All validators treat an empty string as "valid" — pair with a separate
// required-field check where a field is mandatory.

export function sanitizeText(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidEmail(value: string): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  if (!value) return true;
  return /^[+\d][\d\s().-]{6,19}$/.test(value);
}

export function isValidUrl(value: string): boolean {
  if (!value) return true;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return /^[^.\s]+\.[^.\s]+/.test(url.hostname);
  } catch {
    return false;
  }
}

export function isValidDate(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}

// b must be on/after a. Empty values are treated as "no constraint".
export function isDateOnOrAfter(a: string, b: string): boolean {
  if (!a || !b) return true;
  return b >= a;
}

export function splitSanitizedList(value: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of value.split(",")) {
    const item = sanitizeText(raw);
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    result.push(item);
  }
  return result;
}
