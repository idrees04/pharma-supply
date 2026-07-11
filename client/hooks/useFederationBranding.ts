import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '@/api/requests';
import type { ApiResponse } from '@/types/api/products';
import {
  FederationBranding,
  FALLBACK_FAVICON,
  FALLBACK_LOGO,
  getDefaultFederationId,
  loadFederationBranding,
  resolveMediaUrl,
  saveFederationBranding,
  formatFederationAddress,
} from '@/lib/federationBranding';

type FederationBrandingResponse = ApiResponse<FederationBranding>;

async function fetchFederationBranding(federationId: number): Promise<FederationBranding> {
  const response = await get<FederationBrandingResponse>(`/api/Federations/${federationId}/branding`);
  return response.data;
}

/** Branding from login cache, with optional API fetch for login screen / missing cache. */
export function useFederationBranding(options?: { federationId?: number; enabled?: boolean }) {
  const cached = loadFederationBranding();
  const federationId = options?.federationId ?? cached?.federationId ?? getDefaultFederationId();
  const enabled = options?.enabled ?? true;

  const query = useQuery({
    queryKey: ['federationBranding', federationId],
    queryFn: () => fetchFederationBranding(federationId),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      saveFederationBranding(query.data);
    }
  }, [query.data]);

  const branding = query.data ?? cached;
  const addressLine = formatFederationAddress(branding);

  return {
    branding,
    logoSrc: resolveMediaUrl(branding?.logoUrl, FALLBACK_LOGO),
    faviconSrc: resolveMediaUrl(branding?.faviconUrl, FALLBACK_FAVICON),
    federationName: branding?.federationName ?? 'Ideal Distributor',
    contactPerson: branding?.contactPerson?.trim() || null,
    email: branding?.email?.trim() || null,
    phoneNumber: branding?.phoneNumber?.trim() || null,
    addressLine,
    salesTaxNumber: branding?.taxNumber?.trim() || null,
    ntn: branding?.licenseNumber?.trim() || null,
    isLoading: enabled && query.isPending && !branding,
  };
}
