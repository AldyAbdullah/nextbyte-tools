export const RECENT_TOOLS_KEY = 'nextbyte_recent_tools';
export const FAVORITE_TOOLS_KEY = 'nextbyte_favorite_tools';
export const SEND_HISTORY_KEY = 'nextbyte_send_history';
export const SEND_SOUND_KEY = 'nextbyte_send_sound_enabled';

export function getRecentTools(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordRecentTool(slug: string) {
  if (typeof window === 'undefined' || !slug) return;
  try {
    const existing = getRecentTools().filter((s) => s !== slug);
    const updated = [slug, ...existing].slice(0, 8); // Keep last 8 tools
    localStorage.setItem(RECENT_TOOLS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('nextbyte_recent_tools_updated'));
  } catch {}
}

export function getFavoriteTools(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAVORITE_TOOLS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteTool(slug: string): boolean {
  if (typeof window === 'undefined' || !slug) return false;
  try {
    const current = getFavoriteTools();
    let updated: string[];
    let isFav = false;
    if (current.includes(slug)) {
      updated = current.filter((s) => s !== slug);
      isFav = false;
    } else {
      updated = [...current, slug];
      isFav = true;
    }
    localStorage.setItem(FAVORITE_TOOLS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('nextbyte_favorite_tools_updated'));
    return isFav;
  } catch {
    return false;
  }
}

export function isFavoriteTool(slug: string): boolean {
  if (typeof window === 'undefined' || !slug) return false;
  return getFavoriteTools().includes(slug);
}
