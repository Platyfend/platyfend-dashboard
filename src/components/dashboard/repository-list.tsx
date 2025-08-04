"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { 
  GitBranch, 
  Star, 
  GitFork, 
  Lock, 
  Globe, 
  ExternalLink, 
  RefreshCw,
  Calendar,
  Code
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { SyncError, NetworkError } from "@/src/components/ui/error-boundary";
import { getProviderDisplayName } from "@/src/lib/utils/provider";

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  language?: string;
  stars: number;
  forks: number;
  url?: string;
  defaultBranch?: string;
  lastSync: string;
  addedAt: string;
}

interface RepositoryListProps {
  repositories: Repository[];
  organizationName: string;
  provider?: string; // VCS provider type
  isLoading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onRepositoryClick?: (repository: Repository) => void;
}

export function RepositoryList({
  repositories,
  organizationName,
  provider = 'github', // Default to GitHub for backward compatibility
  isLoading = false,
  error,
  onRefresh,
  onRepositoryClick
}: RepositoryListProps) {
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getLanguageColor = (language?: string) => {
    const colors: Record<string, string> = {
      'JavaScript': 'bg-yellow-500',
      'TypeScript': 'bg-blue-500',
      'Python': 'bg-green-500',
      'Java': 'bg-orange-500',
      'Go': 'bg-cyan-500',
      'Rust': 'bg-orange-600',
      'C++': 'bg-pink-500',
      'C#': 'bg-purple-500',
      'PHP': 'bg-indigo-500',
      'Ruby': 'bg-red-500',
    };
    return colors[language || ''] || 'bg-gray-500';
  };

  if (repositories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No repositories yet
          </h3>
          <p className="text-muted-foreground text-center mb-4 max-w-md">
            {organizationName} hasn't added any repositories yet. Install the {getProviderDisplayName(provider)} app
            and select repositories to get started with automated code reviews.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show error if present
  if (error) {
    return (
      <div className="space-y-4">
        {error.includes('network') || error.includes('connection') ? (
          <NetworkError
            error={error}
            onRetry={onRefresh}
            isRetrying={isLoading}
          />
        ) : (
          <SyncError
            error={error}
            onSync={onRefresh}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Repositories ({repositories.length})
          </h3>
          <p className="text-sm text-muted-foreground">
            Repositories connected to {organizationName}
          </p>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        )}
      </div>

      {/* Repository grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {repositories.map((repo) => (
          <Card 
            key={repo.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onRepositoryClick?.(repo)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base font-semibold truncate">
                    {repo.name}
                  </CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {repo.fullName}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {repo.private ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                  {repo.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(repo.url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Description */}
              {repo.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {repo.description}
                </p>
              )}

              {/* Language and stats */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {repo.language && (
                    <div className="flex items-center space-x-1">
                      <div 
                        className={`w-3 h-3 rounded-full ${getLanguageColor(repo.language)}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {repo.language}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3" />
                    <span>{repo.stars}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GitFork className="h-3 w-3" />
                    <span>{repo.forks}</span>
                  </div>
                </div>
              </div>

              {/* Badges and metadata */}
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="secondary" className="text-xs">
                  {repo.private ? 'Private' : 'Public'}
                </Badge>
                {repo.defaultBranch && (
                  <Badge variant="outline" className="text-xs">
                    <Code className="h-3 w-3 mr-1" />
                    {repo.defaultBranch}
                  </Badge>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Added {formatDate(repo.addedAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <RefreshCw className="h-3 w-3" />
                  <span>Synced {formatDate(repo.lastSync)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Simplified repository card for compact display
export function RepositoryCard({ 
  repository, 
  onClick 
}: { 
  repository: Repository; 
  onClick?: (repo: Repository) => void;
}) {
  return (
    <Card 
      className="hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onClick?.(repository)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{repository.name}</h4>
            <p className="text-sm text-muted-foreground truncate">
              {repository.fullName}
            </p>
          </div>
          <div className="flex items-center space-x-2 ml-2">
            {repository.private ? (
              <Lock className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Globe className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant="outline" className="text-xs">
              {repository.language || 'Unknown'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
