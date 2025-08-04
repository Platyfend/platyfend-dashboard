"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/src/components/ui/alert";
import { useOrganizationRepos, useOrganizationRepoSync, organizationNeedsInstallation } from "@/src/hooks/use-organization-repos";
import { useOrganizations } from "@/src/hooks/use-organizations";
import { LoadingSpinner } from "@/src/components/dashboard/loading-spinner";
import { AddRepositoriesButton } from "@/src/components/dashboard/add-repositories-button";
import { RepositoryList } from "@/src/components/dashboard/repository-list";
import { getProviderDisplayName } from "@/src/lib/utils/provider";
import { toInstallationStatus } from "@/src/lib/utils/installation-status";

// Main Repositories Page Component
interface RepositoriesPageProps {
  organizationId: string;
}

export function RepositoriesPage({ organizationId }: RepositoriesPageProps) {
  const { data: repositoriesData, isLoading } = useOrganizationRepos(organizationId);
  const { mutate: syncRepositories, isPending: isSyncing } = useOrganizationRepoSync(organizationId);
  const { data: organizationsData } = useOrganizations();

  // Find current organization - organizationId should be the GitHub org_id
  const currentOrg = organizationsData?.organizations?.find(org => org.id === organizationId);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">Loading repositories...</p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Repositories</h1>
          <p className="text-slate-600 mt-1">
            Manage repositories for {currentOrg?.name || 'your organization'}
          </p>
        </div>
        <AddRepositoriesButton
          organizationId={currentOrg?.id}
          organizationType={currentOrg?.type}
          installationStatus={toInstallationStatus(currentOrg?.installationStatus)}
          provider={currentOrg?.provider}
        />
      </div>

      <RepositoryList
        repositories={repositoriesData?.repositories || []}
        organizationName={currentOrg?.name || 'Organization'}
        provider={currentOrg?.provider}
        isLoading={isSyncing}
        onRefresh={() => syncRepositories()}
      />
    </div>
  );
}
