export interface FederationBranding {
  federationId: number;
  federationName: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  taxNumber?: string | null;
  licenseNumber?: string | null;
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
  console.log('path:', path)
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
  contactPerson?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}): FederationBranding {
  return {
    federationId: data.federationId ?? DEFAULT_FEDERATION_ID,
    federationName: data.federationName ?? 'Ideal Distributor',
    logoUrl: data.logoUrl,
    faviconUrl: data.faviconUrl,
    contactPerson: data.contactPerson,
    email: data.email,
    phoneNumber: data.phoneNumber,
    address: data.address,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    country: data.country,
  };
}

/** Single-line postal address for print documents. */
export function formatFederationAddress(branding?: FederationBranding | null): string | null {
  if (!branding) return null;
  const parts = [
    branding.address?.trim(),
    branding.city?.trim(),
    branding.state?.trim(),
    branding.postalCode?.trim(),
    branding.country?.trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

export function getDefaultFederationId(): number {
  return DEFAULT_FEDERATION_ID;
}

export interface ResolvedFederationBranding {
  federationId: number;
  federationName: string;
  logoSrc: string;
  faviconSrc: string;
}

/** Sync branding for print/PDF utilities (reads login cache + fallbacks). */
export function getResolvedFederationBranding(): ResolvedFederationBranding {
  const cached = loadFederationBranding();
  return {
    federationId: cached?.federationId ?? DEFAULT_FEDERATION_ID,
    federationName: cached?.federationName ?? 'Ideal Distributor',
    logoSrc: resolveMediaUrl(cached?.logoUrl, FALLBACK_LOGO),
    faviconSrc: resolveMediaUrl(cached?.faviconUrl, FALLBACK_FAVICON),
  };
}

/** Fetch logo as data URL for jsPDF embedding; returns null on failure. */
export async function loadLogoDataUrl(logoSrc: string): Promise<string | null> {
  try {
    const response = await fetch(logoSrc, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export { FALLBACK_LOGO, FALLBACK_FAVICON };
