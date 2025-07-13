// Global type definitions for the application

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Session {
  user: User;
  expires: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  createdAt: Date;
  updatedAt: Date;
  members: WorkspaceMember[];
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'member';
  user: User;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string | null;
  url: string;
  isPrivate: boolean;
  language?: string | null;
  stars: number;
  forks: number;
  externalId: string;
  vcsInstallationId: string;
  workspaceId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  description?: string | null;
  status: string;
  sourceBranch: string;
  targetBranch: string;
  author: string;
  authorId: string;
  url: string;
  externalId: string;
  repositoryId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  status: string;
  pullRequestId: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface CreateWorkspaceForm {
  name: string;
  description?: string;
}

export interface LoginForm {
  email: string;
  password: string;
}

// Component prop types
export interface DashboardLayoutProps {
  children: React.ReactNode;
}

export interface DashboardHeaderProps {
  user: User;
}

export interface SidebarProps {
  className?: string;
}

// Utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Environment variables type
export interface EnvironmentVariables {
  DATABASE_URL: string;
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_APP_ID: string;
  GITHUB_PRIVATE_KEY: string;
  GITHUB_WEBHOOK_SECRET: string;
  RABBITMQ_URL: string;
  PYTHON_BACKEND_URL: string;
  NEXTJS_CALLBACK_URL: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_PUBLISHABLE_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
}
