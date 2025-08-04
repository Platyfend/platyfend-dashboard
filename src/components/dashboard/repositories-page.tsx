"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  ChevronUp,
  ChevronDown,
  Settings,
  AlertCircle,
  ExternalLink,
  GitBranch
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { useRepositories } from "@/src/hooks/use-repositories";
import { signIn } from "next-auth/react";
import { VCSProviderType } from "@/src/types";
import { RepositoriesError } from "@/src/types/repositories";
import { LoadingSpinner } from "@/src/components/dashboard/loading-spinner";
import { useEffect } from "react";

// GitHub Auth Error Component
function GitHubAuthError() {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">GitHub Account Required</AlertTitle>
      <AlertDescription className="text-orange-700 mt-2">
        <p className="mb-3">
          You need to connect your GitHub account to access repositories.
        </p>
        <Button
          onClick={() => signIn('github')}
          variant="platyfend"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          Connect GitHub Account
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// GitHub App Installation Error Component
function GitHubAppInstallError({ installUrl }: { installUrl?: string }) {
  const handleInstallApp = () => {
    if (installUrl) {
      window.open(installUrl, '_blank');
    }
  };

  return (
    <Alert className="border-blue-200 bg-blue-50">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-800">GitHub App Installation Required</AlertTitle>
      <AlertDescription className="text-blue-700 mt-2">
        <p className="mb-3">
          Install the Platyfend GitHub app to access your repositories and enable code review features.
        </p>
        <Button
          onClick={handleInstallApp}
          disabled={!installUrl}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Install GitHub App
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// VCS Connection Error Component
function VCSConnectionError({
  missingProviders,
  availableProviders
}: {
  missingProviders?: VCSProviderType[];
  availableProviders?: VCSProviderType[];
}) {
  const getProviderIcon = (provider: VCSProviderType) => {
    switch (provider) {
      case 'github':
        return (
          <svg className="w-4 h-4" fill="black" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
        );
      case 'gitlab':
        return <GitBranch className="w-4 h-4" />;
      case 'bitbucket':
        return <GitBranch className="w-4 h-4" />;
      case 'azure':
        return <GitBranch className="w-4 h-4" />;
      default:
        return <GitBranch className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider: VCSProviderType) => {
    switch (provider) {
      case 'github':
        return 'GitHub';
      case 'gitlab':
        return 'GitLab';
      case 'bitbucket':
        return 'Bitbucket';
      case 'azure':
        return 'Azure DevOps';
      default:
        return provider;
    }
  };

  const handleConnect = (provider: VCSProviderType) => {
    if (provider === 'github') {
      signIn('github');
    } else {
      // For other providers, you would implement their OAuth flow
      console.log(`Connect to ${provider} - not implemented yet`);
    }
  };

  return (
<Alert className="bg-primary border text-gray-600 shadow-sm">
  <AlertCircle className="h-4 w-4 text-primary" />
  <AlertTitle className="text-foreground">
    Connect Your Version Control Accounts
  </AlertTitle>
  <AlertDescription className="text-foreground mt-2">
    <p className="mb-4">
      Connect your version control accounts to access repositories and enable automated code reviews with Platyfend.
    </p>
    <div className="bg-platyfend-500 text-white p-4">TEST COLOR</div>
    <div className="space-y-3">
      {availableProviders?.map((provider) => (
        <div
          key={provider}
          className="flex items-center justify-between p-3 bg-background rounded-lg border border-border"
        >
          <div className="flex items-center space-x-3">
            {getProviderIcon(provider)}
            <span className="font-medium text-foreground">{getProviderName(provider)}</span>
          </div>
          

          <Button
            onClick={() => handleConnect(provider)}
            size="sm"
            variant="platyfend"
            disabled={provider !== 'github'}
          >
            Connect
          </Button>
        </div>
      ))}
    </div>
    {missingProviders && missingProviders.length > 0 && (
      <p className="text-sm text-muted-foreground mt-3">
        Missing connections: {missingProviders.map(getProviderName).join(', ')}
      </p>
    )}
  </AlertDescription>
</Alert>
  );
}

// Repository List Component
interface RepositoryListProps {
  organizationId: string;
}

export function RepositoryList({ organizationId }: RepositoryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState("10");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { data: repositoriesData, isLoading, error } = useRepositories({ organizationId });

  useEffect(() => {
    setCurrentPage(1);
  }, [repositoriesData, searchQuery, rowsPerPage]);

  // Handle loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Handle error states
  if (error) {
    const repositoriesError = error as RepositoriesError;

    if (repositoriesError.requiresGitHubAuth) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
            <p className="text-slate-600 mt-1">
              Connect your GitHub account to access repositories.
            </p>
          </div>
          <GitHubAuthError />
        </div>
      );
    }

    if (repositoriesError.requiresGitHubAppInstall) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
            <p className="text-slate-600 mt-1">
              Install the GitHub app to access your repositories.
            </p>
          </div>
          <GitHubAppInstallError installUrl={repositoriesError.installUrl} />
        </div>
      );
    }

    if (repositoriesError.requiresVCSConnection) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
            <p className="text-slate-600 mt-1">
              Connect your version control accounts to get started.
            </p>
          </div>
          <VCSConnectionError
            missingProviders={repositoriesError.missingProviders}
            availableProviders={repositoriesError.availableProviders}
          />
        </div>
      );
    }

    // Generic error fallback
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">
            Error loading repositories.
          </p>
        </div>
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-700">
            {repositoriesError.message || 'An unexpected error occurred while loading repositories.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Use actual repositories data or fallback to empty array
  const repositories = repositoriesData?.repositories || [];

  const filteredRepos = repositories.filter((repo) =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const comparison = a.name.localeCompare(b.name);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Pagination calculations
  const rowsPerPageNum = parseInt(rowsPerPage);
  const totalPages = Math.ceil(filteredRepos.length / rowsPerPageNum);
  const startIndex = (currentPage - 1) * rowsPerPageNum;
  const endIndex = startIndex + rowsPerPageNum;
  const paginatedRepos = filteredRepos.slice(startIndex, endIndex);

  // Pagination handlers
  const goToFirstPage = () => setCurrentPage(1);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const goToLastPage = () => setCurrentPage(totalPages);

  const handleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1 text-sm sm:text-base">
            List of repositories accessible to Platyfend.
          </p>
        </div>
        <Button
          className="shadow-sm w-full sm:w-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Repositories
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Repo not found? Search here..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full sm:max-w-md rounded-lg shadow-sm focus:border-primary focus:ring-primary"
        />
      </div>

      {/* Repository Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[400px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 sm:py-4 px-4 sm:px-6 font-medium text-slate-700">
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1 hover:text-slate-900 transition-colors text-sm sm:text-base cursor-pointer"
                  >
                    Repository
                    {sortOrder === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedRepos.length === 0 ? (
                <tr>
                  <td className="py-12 px-6 text-center text-slate-500">
                    {searchQuery ? 'No repositories found matching your search.' : 'No repositories available.'}
                  </td>
                </tr>
              ) : (
                paginatedRepos.map((repo) => (
                  <tr
                    key={repo.id}
                    className="border-b border-slate-200 hover:bg-slate-50 group relative transition-colors"
                  >
                    <td className="py-3 sm:py-4 px-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900 text-sm sm:text-base">{repo.name}</div>
                          {repo.description && (
                            <div className="text-sm text-slate-500 mt-1">{repo.description}</div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                            {repo.language && (
                              <span className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                {repo.language}
                              </span>
                            )}
                            <span>⭐ {repo.stars}</span>
                            <span>🍴 {repo.forks}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${repo.isPrivate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {repo.isPrivate ? 'Private' : 'Public'}
                            </span>
                          </div>
                        </div>
                        <button className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-200 rounded flex-shrink-0 cursor-pointer">
                          <Settings className="w-4 h-4 text-slate-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 space-y-3 sm:space-y-0">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className="hidden sm:inline">Rows per page</span>
            <span className="sm:hidden">Per page:</span>
            <Select value={rowsPerPage} onValueChange={setRowsPerPage}>
              <SelectTrigger className="w-16 sm:w-20 h-10 rounded-md shadow-sm border-slate-300">
                <SelectValue className="text-slate-600" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-slate-600 bg-white rounded-md shadow-sm my-1">
                  5
                </SelectItem>

                <SelectItem value="10" className="text-slate-600 bg-white rounded-md shadow-sm my-1">
                  10
                </SelectItem>

                <SelectItem value="20" className="text-slate-600 bg-white rounded-md shadow-sm my-1">
                  20
                </SelectItem>

                <SelectItem value="50" className="text-slate-600 bg-white rounded-md shadow-sm my-1">
                  50
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-4">
            <span className="text-sm text-slate-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={goToFirstPage}
                className="h-8 w-8 p-0 shadow-sm rounded-md"
              >
                ≪
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={goToPreviousPage}
                className="h-8 w-8 p-0 shadow-sm rounded-md"
              >
                ‹
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={goToNextPage}
                className="h-8 w-8 p-0 shadow-sm rounded-md"
              >
                ›
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={goToLastPage}
                className="h-8 w-8 p-0 shadow-sm rounded-md"
              >
                ≫
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export a page component that uses the repository list
interface RepositoriesPageProps {
  organizationId: string;
}

export function RepositoriesPage({ organizationId }: RepositoriesPageProps) {
  return <RepositoryList organizationId={organizationId} />;
}
