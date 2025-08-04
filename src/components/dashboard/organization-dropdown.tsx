"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, RefreshCw, ExternalLink } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useOrganizations } from "@/src/hooks/use-organizations";

export function OrganizationDropdown() {
  const router = useRouter();
  const { data: organizationsData, isLoading, error } = useOrganizations();

  const organizations = organizationsData?.organizations || [];
  const currentOrg = organizations.find(org => org.isCurrent) || organizations[0] || null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full p-3 flex items-center space-x-3">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="flex flex-col space-y-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    const isTimeoutError = error.message?.includes('timeout') || error.message?.includes('buffering');

    return (
      <div className="w-full p-3 flex items-center space-x-3">
        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
          <ExternalLink className="h-4 w-4 text-red-500" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-red-900 text-sm">
            {isTimeoutError ? 'Connection timeout' : 'Error loading organizations'}
          </span>
          <span className="text-xs text-red-600">
            {isTimeoutError ? 'Database is slow, please retry' : 'Click to retry'}
          </span>
        </div>
      </div>
    );
  }

  const getProviderIcon = (provider: 'github' | 'gitlab') => {
    switch (provider) {
      case 'github':
        return (
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            role="img"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"></path>
          </svg>
        );
      case 'gitlab':
        return (
          <svg
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            role="img"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="m23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  const handleExpandAccess = () => {
    // This would redirect to OAuth to expand permissions
    console.log('Expanding OAuth access...');
  };

  const handleOrganizationSelect = (orgId: string) => {
    // Navigate to the organization-specific repositories page
    router.push(`/dashboard/${orgId}/repositories`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between h-auto p-3 hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={currentOrg?.avatar || ""} alt={currentOrg?.name || ""} />
              <AvatarFallback className="bg-gray-100">
                {currentOrg ? getProviderIcon(currentOrg.provider || 'github') : getProviderIcon('github')}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start">
              <span className="font-medium text-gray-900 text-sm">
                {currentOrg?.name || 'No Organization'}
              </span>
              <span className="text-xs text-gray-500">
                {currentOrg ? 'Change Organization' : 'Connect Repository'}
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        className="w-80 p-0"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        {/* Organizations Header */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Organizations</h3>
            <div className="flex items-center space-x-1">
              <RefreshCw className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Synced</span>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="py-2">
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="px-4 py-3 cursor-pointer hover:bg-gray-50 focus:bg-gray-50"
                onClick={() => handleOrganizationSelect(org.id)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={org.avatar || ""} alt={org.name} />
                      <AvatarFallback className="bg-gray-100 text-xs">
                        {getProviderIcon(org.provider)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-900">{org.name}</span>
                  </div>
                  {org.isCurrent && (
                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 hover:bg-orange-100">
                      Current
                    </Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-500 mb-2">No organizations found</p>
              <p className="text-xs text-gray-400">Connect your GitHub or GitLab account to see organizations</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Can't find organization section */}
        <div className="px-4 py-3">
          <p className="text-sm text-gray-600 mb-2">Can't find an organization?</p>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-between text-sm"
            onClick={handleExpandAccess}
          >
            <span>Check Permissions</span>
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
