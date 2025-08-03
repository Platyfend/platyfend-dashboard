
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
  provider: 'github' | 'gitlab';
  isPrivate: boolean;
  language: string;
  stars: number;
  forks: number;
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