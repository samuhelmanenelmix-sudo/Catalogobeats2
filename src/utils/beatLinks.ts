import { Beat } from '../types';

/**
 * Converts a beat title or raw string into a clean, URL-friendly slug.
 * Example: 'El Subestimado' -> 'el-subestimado'
 * Example: 'Trap Pesado #01 (Prod. Samu)' -> 'trap-pesado-01-prod-samu'
 */
export function getBeatSlug(beatOrTitle: Beat | string): string {
  const raw = typeof beatOrTitle === 'string' 
    ? beatOrTitle 
    : (beatOrTitle?.title || beatOrTitle?.id || '');

  if (!raw) return '';

  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics / accents
    .replace(/[^a-z0-9]+/g, '-')     // replace spaces & special symbols with single hyphen
    .replace(/^-+|-+$/g, '');        // trim leading/trailing hyphens
}

/**
 * Builds the direct permanent clean URL to a specific beat product.
 * Formats: ?beat=el-subestimado using the current deployment origin & base path cleanly.
 */
export function getBeatDirectUrl(beatOrTarget: Beat | string): string {
  let slug = '';
  if (typeof beatOrTarget === 'object' && beatOrTarget !== null) {
    slug = getBeatSlug(beatOrTarget);
  } else if (typeof beatOrTarget === 'string') {
    const trimmed = beatOrTarget.trim();
    // If it looks like a title with spaces/accents or already has slug format
    slug = getBeatSlug(trimmed);
    // If slug became empty (e.g. only symbols), fallback to encoded raw string
    if (!slug) slug = encodeURIComponent(trimmed.toLowerCase());
  }

  if (typeof window === 'undefined') {
    return `/?beat=${slug}`;
  }

  const origin = window.location.origin.replace(/\/+$/, '');
  let pathname = window.location.pathname;
  if (!pathname.endsWith('/')) {
    pathname += '/';
  }

  return `${origin}${pathname}?beat=${slug}`;
}

/**
 * Builds a ready-to-paste template for YouTube / Social Media descriptions.
 */
export function getBeatYoutubeSnippet(beat: Beat): string {
  const directUrl = getBeatDirectUrl(beat);
  const producer = beat.producer || 'Samu Helman en el mix';
  
  return `🎵 Beat: "${beat.title}" | Prod. ${producer}
🛒 Compra tu licencia oficial en este enlace:
${directUrl}

⚡ Entrega inmediata (MP3, WAV, Stems) + Contrato de Licencia Oficial.`;
}

/**
 * Quick one-line YouTube description line:
 * "Compra este beat en este enlace: https://.../?beat=el-subestimado"
 */
export function getBeatYoutubeShortSnippet(beat: Beat): string {
  const directUrl = getBeatDirectUrl(beat);
  return `Compra este beat en este enlace: ${directUrl}`;
}

/**
 * Copies text to clipboard safely with fallback for iframes.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('No se pudo copiar al portapapeles:', err);
    return false;
  }
}
