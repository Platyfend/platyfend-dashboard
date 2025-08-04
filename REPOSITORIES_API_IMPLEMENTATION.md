# Repositories API Implementation

This document explains the implementation of the repositories API endpoint that checks user authentication, GitHub app installation, and repository access.

## Overview

The `/api/repositories` endpoint implements a multi-step verification process:

1. **User Authentication Check** - Verifies the user has a valid session
2. **GitHub Account Verification** - Ensures the user has linked their GitHub account
3. **Workspace Management** - Creates or finds the user's workspace
4. **GitHub App Installation Check** - Verifies the GitHub app is installed
5. **Repository Retrieval** - Fetches repositories for the workspace

## Implementation Details

### Step 1: User Authentication Check

```typescript
const session = await getServerSession(authOptions)

if (!session || !session.user?.id) {
    return NextResponse.json({ 
        error: 'Unauthorized',
        message: 'User must be logged in to access repositories'
    }, { status: 401 })
}
```

### Step 2: GitHub Account Verification

```typescript
const githubAccount = await accountsCollection.findOne({
    userId: session.user.id,
    provider: 'github'
})

if (!githubAccount) {
    return NextResponse.json({
        error: 'No GitHub account linked',
        message: 'Please link your GitHub account to access repositories',
        requiresGitHubAuth: true
    }, { status: 403 })
}
```

### Step 3: Workspace Management

The API automatically creates a default workspace for users who don't have one:

```typescript
let userWorkspace = await workspacesCollection.findOne({
    'members.userId': session.user.id,
    'members.role': { $in: ['owner', 'admin', 'member'] }
})

if (!userWorkspace) {
    // Create default workspace for user
    const defaultWorkspace = {
        _id: new ObjectId(),
        name: `${session.user.name || session.user.email}'s Workspace`,
        slug: `workspace-${session.user.id}`,
        description: 'Default workspace',
        // ... other fields
    }
    await workspacesCollection.insertOne(defaultWorkspace)
    userWorkspace = defaultWorkspace
}
```

### Step 4: GitHub App Installation Check

```typescript
const githubInstallation = await installationsCollection.findOne({
    $or: [
        { workspaceId: userWorkspace._id.toString() },
        { userId: session.user.id }
    ],
    provider: 'github',
    status: 'active'
})

if (!githubInstallation) {
    const installUrl = `https://github.com/apps/${env.GITHUB_APP_NAME}/installations/new?state=${userWorkspace._id.toString()}`
    
    return NextResponse.json({
        error: 'GitHub app not installed',
        message: 'Please install the Platyfend GitHub app to access your repositories',
        requiresGitHubAppInstall: true,
        installUrl: installUrl,
        workspaceId: userWorkspace._id.toString()
    }, { status: 403 })
}
```

### Step 5: Repository Retrieval

```typescript
const repositories = await repositoriesCollection
    .find({ 
        workspaceId: userWorkspace._id.toString(),
        vcsInstallationId: githubInstallation.installationId
    })
    .sort({ createdAt: -1 })
    .toArray()
```

## Frontend Integration

### Updated Hook

The `useRepositories` hook now handles the new error states:

```typescript
export function useRepositories() {
    return useQuery<RepositoriesResponse, RepositoriesError>({
        queryKey: ['repositories'],
        queryFn: async () => {
            const response = await fetch("/api/repositories")
            const data = await response.json()
            
            if (!response.ok) {
                const error: RepositoriesError = {
                    message: data.message || `Failed to fetch repositories: ${response.statusText}`,
                    requiresGitHubAuth: data.requiresGitHubAuth,
                    requiresGitHubAppInstall: data.requiresGitHubAppInstall,
                    installUrl: data.installUrl,
                    workspaceId: data.workspaceId
                }
                throw error
            }

            return data
        },
        retry: (failureCount, error) => {
            // Don't retry if it's an auth or installation issue
            if (error?.requiresGitHubAuth || error?.requiresGitHubAppInstall) {
                return false
            }
            return failureCount < 2
        }
    })
}
```

### UI Components

The repositories page now shows appropriate error states:

- **GitHub Auth Required**: Shows a button to connect GitHub account
- **GitHub App Installation Required**: Shows a button to install the GitHub app
- **Loading State**: Shows a spinner while loading
- **Repository List**: Displays actual repository data with metadata

## Database Collections

### Required Collections

1. **accounts** - Stores OAuth account information
2. **workspaces** - Stores workspace information and members
3. **repositories** - Stores repository metadata
4. **github_installations** - Stores GitHub app installation data

### Sample Documents

#### Account Document
```json
{
  "_id": "...",
  "userId": "user123",
  "provider": "github",
  "providerAccountId": "github123",
  "access_token": "...",
  "refresh_token": "...",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### Workspace Document
```json
{
  "_id": "...",
  "name": "My Workspace",
  "slug": "workspace-user123",
  "description": "Default workspace",
  "members": [{
    "id": "...",
    "userId": "user123",
    "workspaceId": "...",
    "role": "owner",
    "user": { ... }
  }],
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

#### GitHub Installation Document
```json
{
  "_id": "...",
  "installationId": "12345",
  "workspaceId": "workspace123",
  "userId": "user123",
  "provider": "github",
  "status": "active",
  "permissions": { ... },
  "repositorySelection": "all",
  "accountLogin": "username",
  "accountType": "User",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Environment Variables

Add to your `.env` file:

```env
GITHUB_APP_NAME=platyfend
```

## Error Handling

The API returns specific error codes and messages for different scenarios:

- **401 Unauthorized**: User not logged in
- **403 Forbidden**: GitHub account not linked or app not installed
- **500 Internal Server Error**: Database or server errors

Each error response includes:
- `error`: Error type
- `message`: Human-readable error message
- `requiresGitHubAuth`: Boolean indicating if GitHub auth is needed
- `requiresGitHubAppInstall`: Boolean indicating if app installation is needed
- `installUrl`: URL to install the GitHub app (when applicable)
- `workspaceId`: User's workspace ID (when applicable)
