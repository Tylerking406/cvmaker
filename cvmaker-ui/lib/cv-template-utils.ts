export function formatDate(d?: string | null): string {
  if (!d) return "";
  const [year, month] = d.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[parseInt(month) - 1]} ${year}`;
}

export function yearOnly(d?: string | null): string {
  return d ? d.split("-")[0] : "";
}

export function normalizeUrl(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

export function dateRange(start?: string | null, end?: string | null, isCurrent?: boolean, formatter: (d?: string | null) => string = formatDate): string {
  const startStr = formatter(start);
  const endStr = isCurrent ? "Present" : formatter(end);
  return startStr && endStr ? `${startStr} – ${endStr}` : startStr || endStr;
}
