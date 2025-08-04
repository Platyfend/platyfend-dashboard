import mongoose, { Schema } from 'mongoose';
import { IOrganization, IRepository, ProviderType, OrganizationType, InstallationStatus } from './types';

// Repository subdocument schema
const RepositorySchema = new Schema<IRepository>(
  {
    repo_id: {
      type: String,
      required: true,
      // Note: Index is created at schema level to avoid duplicates
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    private: {
      type: Boolean,
      required: true,
      default: false,
    },
    installation_id: {
      type: String,
      required: false, // Optional until GitHub App is installed
      index: true, // Index for installation-based queries
    },
    permissions: {
      type: [String],
      required: true,
      default: [],
      validate: {
        validator: function(permissions: string[]) {
          // Validate that permissions are from allowed set
          const allowedPermissions = ['read', 'write', 'admin', 'pull_requests', 'issues', 'metadata'];
          return permissions.every(perm => allowedPermissions.includes(perm));
        },
        message: 'Invalid permission specified'
      }
    },
    added_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    last_sync: {
      type: Date,
      required: true,
      default: Date.now,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    language: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    stars: {
      type: Number,
      min: 0,
      default: 0,
    },
    forks: {
      type: Number,
      min: 0,
      default: 0,
    },
    default_branch: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'main',
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: {
        validator: function(url: string) {
          if (!url) return true; // Optional field
          return /^https?:\/\/.+/.test(url);
        },
        message: 'Invalid URL format'
      }
    },
  },
  {
    _id: false, // Don't create _id for subdocuments
    timestamps: false, // We handle timestamps manually
  }
);

// Organization main schema
const OrganizationSchema = new Schema<IOrganization>(
  {
    org_id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    user_id: {
      type: String,
      required: true,
      ref: 'User',
      index: true, // Index for user-based queries
    },
    repos: {
      type: [RepositorySchema],
      default: [],
      validate: {
        validator: function(repos: IRepository[]) {
          // Limit number of repositories to prevent document size issues
          return repos.length <= 1000;
        },
        message: 'Maximum 1000 repositories allowed per organization'
      }
    },
    provider: {
      type: String,
      enum: Object.values(ProviderType),
      required: true,
    },
    org_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    org_type: {
      type: String,
      enum: Object.values(OrganizationType),
      required: true,
    },
    installation_id: {
      type: String,
      required: true,
      unique: true, // Each installation should be unique
      index: true, // Index for installation-based queries
    },
    installation_status: {
      type: String,
      enum: Object.values(InstallationStatus),
      required: true,
      default: InstallationStatus.PENDING,
    },
    permissions: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    avatar_url: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: {
        validator: function(url: string) {
          if (!url) return true; // Optional field
          return /^https?:\/\/.+/.test(url);
        },
        message: 'Invalid avatar URL format'
      }
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    public_repos: {
      type: Number,
      min: 0,
      default: 0,
    },
    private_repos: {
      type: Number,
      min: 0,
      default: 0,
    },
    total_repos: {
      type: Number,
      min: 0,
      default: 0,
    },
    created_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We handle timestamps manually for better control
    versionKey: '__v', // Enable optimistic locking
  }
);

// Compound indexes for efficient queries
OrganizationSchema.index({ user_id: 1, provider: 1 }); // User's organizations by provider
OrganizationSchema.index({ installation_id: 1, installation_status: 1 }); // Installation status queries
OrganizationSchema.index({ org_id: 1, provider: 1 }); // Organization lookup by external ID
// Note: repos.repo_id index is automatically created by MongoDB for array fields

// Pre-save middleware to update timestamps and calculated fields
OrganizationSchema.pre('save', function(next) {
  this.updated_at = new Date();
  
  // Update total_repos count
  this.total_repos = this.repos.length;
  
  // Update public/private repo counts
  this.public_repos = this.repos.filter(repo => !repo.private).length;
  this.private_repos = this.repos.filter(repo => repo.private).length;
  
  next();
});

// Instance methods
OrganizationSchema.methods.addRepository = function(repository: Omit<IRepository, 'added_at' | 'last_sync'>) {
  const newRepo: IRepository = {
    ...repository,
    added_at: new Date(),
    last_sync: new Date(),
  };
  
  // Check if repository already exists
  const existingIndex = this.repos.findIndex((repo: IRepository) => repo.repo_id === repository.repo_id);
  
  if (existingIndex >= 0) {
    // Update existing repository
    this.repos[existingIndex] = { ...this.repos[existingIndex], ...newRepo, added_at: this.repos[existingIndex].added_at };
  } else {
    // Add new repository
    this.repos.push(newRepo);
  }
  
  return this.save();
};

OrganizationSchema.methods.removeRepository = function(repoId: string) {
  this.repos = this.repos.filter((repo: IRepository) => repo.repo_id !== repoId);
  return this.save();
};

OrganizationSchema.methods.updateRepositorySync = function(repoId: string) {
  const repo = this.repos.find((repo: IRepository) => repo.repo_id === repoId);
  if (repo) {
    repo.last_sync = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Static methods
OrganizationSchema.statics.findByUser = function(userId: string, provider?: ProviderType) {
  const query: any = { user_id: userId };
  if (provider) {
    query.provider = provider;
  }
  return this.find(query);
};

OrganizationSchema.statics.findByInstallation = function(installationId: string) {
  return this.findOne({ installation_id: installationId });
};

export const Organization = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
