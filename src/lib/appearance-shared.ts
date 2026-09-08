export const themePaletteIds = [
  "sparky",
  "beatrice",
  "ocean",
  "sunset",
  "graphite",
] as const;

export const themeModes = ["system", "light", "dark"] as const;

export type ThemePaletteId = (typeof themePaletteIds)[number];
export type ThemeMode = (typeof themeModes)[number];
export type AppearancePreference = {
  palette: ThemePaletteId;
  mode: ThemeMode;
};

export const defaultAppearance: AppearancePreference = {
  palette: "sparky",
  mode: "system",
};

export function isAppearancePreference(value: unknown): value is AppearancePreference {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    themePaletteIds.includes(candidate.palette as ThemePaletteId) &&
    themeModes.includes(candidate.mode as ThemeMode)
  );
}

export function normalizeAppearance(value: unknown): AppearancePreference {
  return isAppearancePreference(value)
    ? { palette: value.palette, mode: value.mode }
    : defaultAppearance;
}
