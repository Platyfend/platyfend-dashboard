"use client";

import React, { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Plus, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { GitHubInstallationError, PermissionError, NetworkError } from "@/src/components/ui/error-boundary";
import { getProviderDisplayName } from "@/src/lib/utils/provider";

interface AddRepositoriesButtonProps {
  organizationId?: string;
  organizationType?: 'personal' | 'organization';
  installationStatus?: 'active' | 'pending' | 'suspended' | 'deleted';
  provider?: string; // VCS provider type
  onInstallationStart?: () => void;
  className?: string;
}

export function AddRepositoriesButton({
  organizationId,
  organizationType = 'personal',
  installationStatus,
  provider = 'github', // Default to GitHub for backward compatibility
  onInstallationStart,
  className
}: AddRepositoriesButtonProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInstallApp = async () => {
    if (!session?.user?.id) {
      setError(`Please sign in to install the ${getProviderDisplayName(provider)} app`);
      return;
    }

    setIsLoading(true);
    setError(null);
    onInstallationStart?.();

    try {
      // Build query parameters for installation
      const params = new URLSearchParams({
        type: organizationType,
      });

      if (organizationId && organizationType === 'organization') {
        params.append('orgId', organizationId);
      }

      // Get installation URL from our API
      const response = await fetch(`/api/github/install?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Installation already exists
          setError(`${getProviderDisplayName(provider)} app is already installed for this organization`);
          return;
        }
        throw new Error(data.message || 'Failed to generate installation URL');
      }

      // Redirect to VCS App installation
      window.location.href = data.installUrl;

    } catch (error) {
      console.error(`Error starting ${getProviderDisplayName(provider)} app installation:`, error);
      setError(error instanceof Error ? error.message : 'Failed to start installation');
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonContent = () => {
    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Redirecting to {getProviderDisplayName(provider)}...
        </>
      );
    }

    switch (installationStatus) {
      case 'active':
        return (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            Manage Repositories
          </>
        );
      case 'suspended':
        return (
          <>
            <AlertCircle className="w-4 h-4 mr-2" />
            Reactivate {getProviderDisplayName(provider)} App
          </>
        );
      case 'deleted':
        return (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Reinstall {getProviderDisplayName(provider)} App
          </>
        );
      default:
        return (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Add Repositories
          </>
        );
    }
  };

  const getButtonVariant = () => {
    switch (installationStatus) {
      case 'active':
        return 'outline';
      case 'suspended':
        return 'destructive';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleInstallApp}
        disabled={isLoading}
        variant={getButtonVariant()}
        className={className}
      >
        {getButtonContent()}
        {installationStatus === 'active' && (
          <ExternalLink className="w-4 h-4 ml-2" />
        )}
      </Button>

      {/* Help text */}

      {/* Error display with smart error handling */}
      {error && (
        <>
          {error.includes('permission') || error.includes('access') ? (
            <PermissionError
              error={error}
              settingsUrl="https://github.com/settings/installations"
              onRetry={() => setError(null)}
            />
          ) : error.includes('network') || error.includes('connection') ? (
            <NetworkError
              error={error}
              onRetry={() => setError(null)}
            />
          ) : error.includes('already installed') ? (
            <GitHubInstallationError
              error={error}
              onRetry={() => setError(null)}
            />
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Installation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Installation status info */}
      {installationStatus === 'active' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>{getProviderDisplayName(provider)} App Installed</AlertTitle>
          <AlertDescription>
            The Platyfend {getProviderDisplayName(provider)} app is successfully installed. You can manage repository
            access and permissions directly on {getProviderDisplayName(provider)}.
          </AlertDescription>
        </Alert>
      )}

      {installationStatus === 'suspended' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Suspended</AlertTitle>
          <AlertDescription>
            {getProviderDisplayName(provider)} app access has been suspended. Please reactivate the app to continue
            using repository features.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Simplified version for quick use
export function QuickAddRepositoriesButton({ 
  className,
  organizationId,
  installationStatus 
}: { 
  className?: string;
  organizationId?: string;
  installationStatus?: 'active' | 'pending' | 'suspended' | 'deleted';
}) {
  return (
    <AddRepositoriesButton
      organizationId={organizationId}
      organizationType="personal"
      installationStatus={installationStatus}
      className={className}
    />
  );
}
