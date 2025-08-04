import { useQuery } from "@tanstack/react-query";
import { RepositoriesError, AvailableRepositoriesResponse } from "@/src/types/repositories";

interface UseRepositoriesOptions {
    organizationId: string;
}

export function useRepositories({ organizationId }: UseRepositoriesOptions) {
    return useQuery<AvailableRepositoriesResponse, RepositoriesError>({
        queryKey: ['repositories', organizationId],
        queryFn: async () => {
            // Fetch repositories for the specific organization
            const response = await fetch(`/api/organizations/${organizationId}/repositories`)
            const data = await response.json()

            if (!response.ok) {
                const error: RepositoriesError = {
                    message: data.message || `Failed to fetch repositories: ${response.statusText}`,
                    missingProviders: data.missingProviders,
                    requiresVCSConnection: data.missingProviders?.length > 0,
                }
                throw error
            }

            return data
        },
        staleTime: 2 * 60 * 1000, // 2 minutes (shorter since this is "live" data)
        retry: (failureCount, error) => {
            if (error?.requiresVCSConnection) {
                return false
            }
            return failureCount < 3
        },
        enabled: !!organizationId, // Only run query if organizationId is provided
    })
}