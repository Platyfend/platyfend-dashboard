# Multi-VCS Provider Architecture

This module implements a scalable multi-VCS (Version Control System) provider architecture that supports GitHub, GitLab, Bitbucket, and Azure DevOps.

## Architecture Overview

### 1. Provider Interface (`types.ts`)
- `VCSProvider`: Interface that all VCS providers must implement
- `VCSProviderRegistry`: Manages all available providers
- Type definitions for linked providers, installations, and detection results

### 2. Provider Implementations (`providers/`)
- `GitHubProvider`: Fully implemented with existing GitHub logic
- `GitLabProvider`: Placeholder implementation for GitLab
- `BitbucketProvider`: Placeholder implementation for Bitbucket  
- `AzureProvider`: Placeholder implementation for Azure DevOps

### 3. Provider Registry (`registry.ts`)
- `DefaultVCSProviderRegistry`: Manages all registered providers
- Singleton instance `vcsProviderRegistry` for global access

### 4. VCS Service (`service.ts`)
- `VCSService`: Orchestrates the multi-VCS flow
- Implements the 5-step process for repository fetching
- Singleton instance `vcsService` for global access

### 5. Utilities (`utils.ts`)
- Workspace lookup functions (no auto-creation)
- Response formatting utilities
- Error response creators

## Multi-VCS Flow

The new repositories API follows this 5-step process:

1. **User Authentication** (unchanged)
   - Validates user session

2. **VCS Provider Detection**
   - Checks which VCS providers user has linked accounts for
   - Returns list of linked and missing providers

3. **Workspace Management**
   - Finds existing user workspace (connected repositories)
   - Returns error if no workspace exists (user must connect repositories first)

4. **Multi-Provider Installation Check**
   - Checks installation status for all linked providers
   - Collects installation URLs for missing integrations

5. **Provider-Specific Repository Fetching**
   - Fetches repositories from all active installations
   - Aggregates results with provider metadata

## Usage

### API Response Format

The new API returns a unified response supporting multiple VCS providers:

```typescript
{
  repositories: RepositoryWithProvider[], // Repositories with provider field
  workspace: {
    id: string,
    name: string,
    slug: string
  },
  vcsConnections: {
    github?: VCSInstallation,
    gitlab?: VCSInstallation,
    bitbucket?: VCSInstallation,
    azure?: VCSInstallation
  },
  missingProviders: VCSProviderType[],
  installationUrls: Record<VCSProviderType, string>
}
```

### Adding New Providers

To add a new VCS provider:

1. Create provider implementation in `providers/` directory
2. Implement the `VCSProvider` interface
3. Register in `DefaultVCSProviderRegistry`
4. Add provider type to `VCSProviderType` union

### Backward Compatibility

- Existing GitHub functionality is preserved
- Original response format fields are maintained for compatibility
- Uses existing `github_installations` collection

## Implementation Status

- ✅ **GitHub**: Fully implemented with existing logic
- 🚧 **GitLab**: Placeholder implementation (TODO)
- 🚧 **Bitbucket**: Placeholder implementation (TODO)
- 🚧 **Azure DevOps**: Placeholder implementation (TODO)

## Migration Notes

- Current implementation uses existing `github_installations` collection
- Future migration to unified `vcs_installations` collection recommended
- Provider-specific metadata stored in `providerSpecificData` field
