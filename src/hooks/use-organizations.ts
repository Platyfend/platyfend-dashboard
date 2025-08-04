import { useQuery } from "@tanstack/react-query";

export interface Organization {
  id: string;
  name: string;
  provider: 'github' | 'gitlab';
  avatar?: string;
  isCurrent?: boolean;
  type: 'personal' | 'organization';
  description?: string;
  publicRepos?: number;
  path?: string;
}

export interface OrganizationsResponse {
  organizations: Organization[];
  totalCount: number;
  missingProviders: string[];
  errors?: Array<{
    provider: string;
    error: string;
  }>;
  user: {
    id: string;
    email?: string;
    name?: string;
  };
}

export interface OrganizationsError {
  message: string;
  missingProviders?: string[];
  requiresVCSConnection?: boolean;
}

export function useOrganizations() {
  return useQuery<OrganizationsResponse, OrganizationsError>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const response = await fetch("/api/organizations", {
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          const error: OrganizationsError = {
            message: data.message || `Failed to fetch organizations: ${response.statusText}`,
            missingProviders: data.missingProviders,
            requiresVCSConnection: data.missingProviders?.length > 0,
          };
          throw error;
        }

        return data;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);

        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw fetchError;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on VCS connection issues
      if (error?.requiresVCSConnection) {
        return false;
      }
      // Don't retry on timeout errors immediately
      if (error?.message?.includes('timeout')) {
        return failureCount < 2; // Fewer retries for timeouts
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });
}
