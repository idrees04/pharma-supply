export interface FederationBranding {
  federationId: number;
  federationName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

const STORAGE_KEY = 'federationBranding';
const DEFAULT_FEDERATION_ID = 3;

const FALLBACK_LOGO = '/ideal-distributor-icon.png';
const FALLBACK_FAVICON = '/ideal-distributor-favicon.png';

/** API host root (without /api suffix) for static uploads. */
export function getApiAssetBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL || 'https://mds.vtoxi.com';
  return base.replace(/\/api\/?$/, '');
}

export function resolveMediaUrl(path?: string | null, fallback = FALLBACK_LOGO): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getApiAssetBaseUrl()}${normalized}`;
}

export function saveFederationBranding(branding: FederationBranding): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
}

export function loadFederationBranding(): FederationBranding | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as FederationBranding) : null;
  } catch {
    return null;
  }
}

export function clearFederationBranding(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function brandingFromLoginResponse(data: {
  federationId?: number;
  federationName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}): FederationBranding {
  return {
    federationId: data.federationId ?? DEFAULT_FEDERATION_ID,
    federationName: data.federationName ?? 'Ideal Distributor',
    logoUrl: data.logoUrl,
    faviconUrl: data.faviconUrl,
  };
}

export function getDefaultFederationId(): number {
  return DEFAULT_FEDERATION_ID;
}

export { FALLBACK_LOGO, FALLBACK_FAVICON };
