import { useQuery } from "@tanstack/react-query";
import { RepositoriesError, AvailableRepositoriesResponse } from "@/src/types/repositories";



export function useRepositories() {
    return useQuery<AvailableRepositoriesResponse, RepositoriesError>({
        queryKey: ['repositories'],
        queryFn: async () => {
            // Fetch all available repositories from connected providers
            const response = await fetch("/api/repositories")
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
        }
    })
}