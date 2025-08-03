import { useQuery } from "@tanstack/react-query";
import { VCSProviderType } from "@/src/types";

export interface RepositoriesError {
  message: string;
  // Legacy GitHub-specific fields (for backward compatibility)
  requiresGitHubAuth?: boolean;
  requiresGitHubAppInstall?: boolean;
  installUrl?: string;
  workspaceId?: string;
  // New multi-VCS fields
  missingProviders?: VCSProviderType[];
  availableProviders?: VCSProviderType[];
  linkedProviders?: VCSProviderType[];
  installationUrls?: Record<VCSProviderType, string>;
  requiresVCSConnection?: boolean;
  // Workspace setup
  requiresWorkspaceSetup?: boolean;
}

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

// Add the interface for the response
export interface AvailableRepositoriesResponse {
  repositories: Repository[];
  totalCount: number;
  connectedProviders: ConnectedProvider[];
  missingProviders: string[];
  errors?: ProviderError[];
  user: {
    id: string;
    email: string;
    name?: string;
  };
}

interface Repository {
  id: string;
  externalId: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  cloneUrl: string;
  httpCloneUrl: string;
  provider: 'github' | 'gitlab';
  isPrivate: boolean;
  language: string;
  stars: number;
  forks: number;
  lastActivity: string;
  createdAt: string;
  avatarUrl?: string;
  ownerName: string;
  defaultBranch: string;
}

interface ConnectedProvider {
  provider: string;
  accountName: string;
  repositoryCount: number;
}

interface ProviderError {
  provider: string;
  error: string;
}