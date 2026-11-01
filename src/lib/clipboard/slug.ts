export const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'send',
  'about',
  'tools',
  'login',
  'register',
  'dashboard',
  'settings',
  'auth',
  'clipboard',
  'receive',
  'terms',
  'privacy',
  'sitemap',
  'robots',
]);

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface SlugValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates custom slug format, length, and reserved words.
 */
export function validateSlug(slug: string): SlugValidationResult {
  const trimmed = slug.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, error: 'Slug tidak boleh kosong.' };
  }

  if (trimmed.length < 3) {
    return { valid: false, error: 'Slug minimal harus 3 karakter.' };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: 'Slug maksimal 30 karakter.' };
  }

  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valid: false, error: 'Slug tidak boleh diawali atau diakhiri tanda hubung (-).' };
  }

  if (trimmed.includes(' ')) {
    return { valid: false, error: 'Slug tidak boleh mengandung spasi.' };
  }

  if (!SLUG_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Slug hanya boleh menggunakan huruf kecil (a-z), angka (0-9), dan tanda hubung (-).',
    };
  }

  if (RESERVED_SLUGS.has(trimmed)) {
    return { valid: false, error: `Slug "${trimmed}" merupakan nama sistem yang tidak dapat digunakan.` };
  }

  return { valid: true };
}

/**
 * Sanitizes raw user input into a clean slug candidate.
 */
export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // remove illegal characters
    .replace(/[\s_]+/g, '-')     // replace spaces & underscores with hyphen
    .replace(/-+/g, '-')         // collapse multiple hyphens
    .slice(0, 30);
}

/**
 * Generates an intuitive, readable random slug candidate.
 */
export function generateRandomSlug(): string {
  const words = ['catatan', 'tugas', 'project', 'shared', 'quick', 'doc', 'memo', 'clip', 'draft'];
  const word = words[Math.floor(Math.random() * words.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${word}-${num}`;
}
