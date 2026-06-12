import { findTimezoneColumn, isValidTimeZone } from "./timezone";

/**
 * Maps a country name/code (as typed in a sheet) to a representative IANA
 * timezone for "send during their business hours". Countries that span many
 * zones use their main business zone (e.g. USA -> US Eastern). Extend freely.
 */
const COUNTRY_TZ: Record<string, string> = {
  usa: "America/New_York",
  us: "America/New_York",
  "u.s.": "America/New_York",
  "u.s.a.": "America/New_York",
  "united states": "America/New_York",
  "united states of america": "America/New_York",
  america: "America/New_York",

  uk: "Europe/London",
  "u.k.": "Europe/London",
  gb: "Europe/London",
  "united kingdom": "Europe/London",
  england: "Europe/London",
  britain: "Europe/London",
  "great britain": "Europe/London",
  scotland: "Europe/London",
  wales: "Europe/London",

  ireland: "Europe/Dublin",
  canada: "America/Toronto",
  ca: "America/Toronto",

  india: "Asia/Kolkata",
  in: "Asia/Kolkata",

  australia: "Australia/Sydney",
  au: "Australia/Sydney",
  "new zealand": "Pacific/Auckland",
  nz: "Pacific/Auckland",

  germany: "Europe/Berlin",
  de: "Europe/Berlin",
  france: "Europe/Paris",
  fr: "Europe/Paris",
  spain: "Europe/Madrid",
  italy: "Europe/Rome",
  netherlands: "Europe/Amsterdam",
  belgium: "Europe/Brussels",
  switzerland: "Europe/Zurich",
  sweden: "Europe/Stockholm",
  poland: "Europe/Warsaw",
  portugal: "Europe/Lisbon",

  uae: "Asia/Dubai",
  "united arab emirates": "Asia/Dubai",
  dubai: "Asia/Dubai",
  "saudi arabia": "Asia/Riyadh",
  israel: "Asia/Jerusalem",

  singapore: "Asia/Singapore",
  sg: "Asia/Singapore",
  japan: "Asia/Tokyo",
  jp: "Asia/Tokyo",
  china: "Asia/Shanghai",
  "hong kong": "Asia/Hong_Kong",
  philippines: "Asia/Manila",
  ph: "Asia/Manila",
  indonesia: "Asia/Jakarta",
  malaysia: "Asia/Kuala_Lumpur",
  pakistan: "Asia/Karachi",

  brazil: "America/Sao_Paulo",
  mexico: "America/Mexico_City",
  argentina: "America/Argentina/Buenos_Aires",
  "south africa": "Africa/Johannesburg",
  nigeria: "Africa/Lagos",
};

/** Curated country -> timezone choices for a campaign-level send-window picker. */
export const COUNTRY_OPTIONS: { label: string; timeZone: string }[] = [
  { label: "United States (Eastern)", timeZone: "America/New_York" },
  { label: "United States (Central)", timeZone: "America/Chicago" },
  { label: "United States (Mountain)", timeZone: "America/Denver" },
  { label: "United States (Pacific)", timeZone: "America/Los_Angeles" },
  { label: "United Kingdom", timeZone: "Europe/London" },
  { label: "Ireland", timeZone: "Europe/Dublin" },
  { label: "Canada (Eastern)", timeZone: "America/Toronto" },
  { label: "India", timeZone: "Asia/Kolkata" },
  { label: "Australia (Sydney)", timeZone: "Australia/Sydney" },
  { label: "New Zealand", timeZone: "Pacific/Auckland" },
  { label: "Germany", timeZone: "Europe/Berlin" },
  { label: "France", timeZone: "Europe/Paris" },
  { label: "Spain", timeZone: "Europe/Madrid" },
  { label: "Italy", timeZone: "Europe/Rome" },
  { label: "Netherlands", timeZone: "Europe/Amsterdam" },
  { label: "UAE (Dubai)", timeZone: "Asia/Dubai" },
  { label: "Saudi Arabia", timeZone: "Asia/Riyadh" },
  { label: "Singapore", timeZone: "Asia/Singapore" },
  { label: "Japan", timeZone: "Asia/Tokyo" },
  { label: "China", timeZone: "Asia/Shanghai" },
  { label: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  { label: "Philippines", timeZone: "Asia/Manila" },
  { label: "Brazil (São Paulo)", timeZone: "America/Sao_Paulo" },
  { label: "Mexico", timeZone: "America/Mexico_City" },
  { label: "South Africa", timeZone: "Africa/Johannesburg" },
];

const COUNTRY_HEADER_CANDIDATES = [
  "country",
  "country/region",
  "country / region",
  "region",
  "nation",
  "location",
];

export function findCountryColumn(headers: string[]): string | null {
  for (const candidate of COUNTRY_HEADER_CANDIDATES) {
    const hit = headers.find((h) => h.trim().toLowerCase() === candidate);
    if (hit) return hit;
  }
  return null;
}

/** A representative IANA timezone for a country name/code, or null. */
export function countryToTimeZone(value: string): string | null {
  return COUNTRY_TZ[value.trim().toLowerCase()] ?? null;
}

/**
 * Resolves a recipient's timezone from their row: a Timezone column with a
 * valid IANA zone wins; otherwise a Country column mapped to a zone; otherwise
 * the given fallback (the campaign's configured zone).
 */
export function resolveRecipientZone(
  rowData: Record<string, string>,
  fallback: string
): string {
  const keys = Object.keys(rowData);

  const tzCol = findTimezoneColumn(keys);
  if (tzCol) {
    const v = rowData[tzCol]?.trim();
    if (v && isValidTimeZone(v)) return v;
  }

  const countryCol = findCountryColumn(keys);
  if (countryCol) {
    const tz = countryToTimeZone(rowData[countryCol] ?? "");
    if (tz) return tz;
  }

  return fallback;
}
