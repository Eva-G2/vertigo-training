const LIGHT_BLUE = "#2949cc";
const LIGHT_DARK_BLUE = "#111d4d";

function readCssColor(variable: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value || fallback;
}

export function themeBlue(): string {
  return readCssColor("--app-blue", LIGHT_BLUE);
}

export function themeDarkBlue(): string {
  return readCssColor("--app-dark-blue", LIGHT_DARK_BLUE);
}
