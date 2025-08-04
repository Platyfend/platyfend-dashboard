import { Document } from 'mongoose';

// Enums
export enum AccountType {
  OAUTH = 'oauth',
}


// Interface definitions
export interface IAccount extends Document {
  _id: string;
  userId: string;
  type: AccountType;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
  // GitHub-specific fields
  githubOrgId?: string; // Organization ID for personal repos
  githubUsername?: string; // GitHub username
  createdAt: Date;
  updatedAt: Date;
}

export interface IVerificationToken extends Document {
  _id: string;
  identifier: string;
  token: string;
  expires: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Organization and Repository types
export enum ProviderType {
  GITHUB = 'github',
  GITLAB = 'gitlab',
  BITBUCKET = 'bitbucket',
}

export enum OrganizationType {
  PERSONAL = 'personal',
  ORGANIZATION = 'organization',
}

export enum InstallationStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
  DELETED = 'deleted',
}

export interface IRepository {
  repo_id: string; // External repository ID (GitHub repo ID)
  name: string; // Repository name
  full_name: string; // Full repository name (owner/repo)
  private: boolean; // Is repository private
  installation_id?: string; // GitHub App installation ID (optional until app is installed)
  permissions: string[]; // Array of permissions granted
  added_at: Date; // When repo was added to organization
  last_sync: Date; // Last synchronization timestamp
  description?: string; // Repository description
  language?: string; // Primary language
  stars?: number; // Star count
  forks?: number; // Fork count
  default_branch?: string; // Default branch name
  url?: string; // Repository URL
}

export interface IOrganization extends Document {
  _id: string;
  org_id: string; // GitHub organization ID or user ID for personal repos
  user_id: string; // Reference to user who owns/manages this org connection
  repos: IRepository[]; // Array of repository objects
  provider: ProviderType; // VCS provider type
  org_name: string; // GitHub organization name or username
  org_type: OrganizationType; // Personal or organization account
  installation_id?: string; // GitHub App installation ID (optional until app is installed)
  installation_status: InstallationStatus; // Installation status
  permissions: Record<string, any>; // GitHub App permissions granted
  avatar_url?: string; // Organization avatar URL
  description?: string; // Organization description
  public_repos?: number; // Number of public repositories
  private_repos?: number; // Number of private repositories
  total_repos?: number; // Total repository count
  created_at: Date; // Creation timestamp
  updated_at: Date; // Last update timestamp
}