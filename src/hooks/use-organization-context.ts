"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export interface OrganizationContext {
  slug?: string;
  name?: string;
  logo?: string;
  isLoading: boolean;
  error?: string;
}

export function useOrganizationContext(): OrganizationContext {
  const [context, setContext] = useState<OrganizationContext>({
    isLoading: true,
  });
  const searchParams = useSearchParams();

  useEffect(() => {
    async function detectOrganization() {
      try {
        setContext(prev => ({ ...prev, isLoading: true, error: undefined }));

        // Check for organization slug in URL parameters
        const orgSlug = searchParams.get("org");
        
        if (orgSlug) {
          // Fetch organization details by slug
          const response = await fetch(`/api/organizations/${orgSlug}`);
          
          if (response.ok) {
            const org = await response.json();
            setContext({
              slug: org.slug,
              name: org.name,
              logo: org.logo,
              isLoading: false,
            });
            return;
          }
        }

        // Check subdomain for organization context
        const hostname = window.location.hostname;
        const subdomain = hostname.split('.')[0];
        
        // Skip common subdomains
        if (subdomain && !['www', 'app', 'api', 'admin'].includes(subdomain)) {
          const response = await fetch(`/api/organizations/by-subdomain/${subdomain}`);
          
          if (response.ok) {
            const org = await response.json();
            setContext({
              slug: org.slug,
              name: org.name,
              logo: org.logo,
              isLoading: false,
            });
            return;
          }
        }

        // No organization context found
        setContext({
          isLoading: false,
        });
      } catch (error) {
        console.error("Error detecting organization context:", error);
        setContext({
          isLoading: false,
          error: "Failed to detect organization context",
        });
      }
    }

    detectOrganization();
  }, [searchParams]);

  return context;
}
