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
      required: false, // Optional until GitHub App is installed
      unique: true, // Each installation should be unique (when set)
      sparse: true, // Allow multiple null values
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
OrganizationSchema.methods.addRepository = async function(repository: Omit<IRepository, 'added_at' | 'last_sync'>) {
  const Model = this.constructor as mongoose.Model<IOrganization>;
  const currentTime = new Date();

  // First, try to update existing repository atomically
  const updateResult = await Model.findOneAndUpdate(
    {
      _id: this._id,
      'repos.repo_id': repository.repo_id
    },
    [
      {
        $set: {
          'repos.$[elem].name': repository.name,
          'repos.$[elem].full_name': repository.full_name,
          'repos.$[elem].private': repository.private,
          'repos.$[elem].installation_id': repository.installation_id,
          'repos.$[elem].permissions': repository.permissions,
          'repos.$[elem].last_sync': currentTime,
          'repos.$[elem].description': repository.description,
          'repos.$[elem].language': repository.language,
          'repos.$[elem].stars': repository.stars,
          'repos.$[elem].forks': repository.forks,
          'repos.$[elem].default_branch': repository.default_branch,
          'repos.$[elem].url': repository.url,
          updated_at: currentTime
        }
      },
      {
        $set: {
          total_repos: { $size: "$repos" },
          public_repos: { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", false] } } } },
          private_repos: { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", true] } } } }
        }
      }
    ],
    {
      new: true,
      runValidators: true,
      arrayFilters: [{ 'elem.repo_id': repository.repo_id }]
    }
  );

  // If repository was found and updated, return the updated document
  if (updateResult) {
    return updateResult;
  }

  // Repository doesn't exist, add it atomically
  const newRepo: IRepository = {
    ...repository,
    added_at: currentTime,
    last_sync: currentTime,
  };

  const addResult = await Model.findOneAndUpdate(
    { _id: this._id },
    [
      {
        $set: {
          repos: { $concatArrays: ["$repos", [newRepo]] },
          updated_at: currentTime,
          total_repos: { $add: [{ $size: "$repos" }, 1] },
          public_repos: {
            $add: [
              { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", false] } } } },
              newRepo.private ? 0 : 1
            ]
          },
          private_repos: {
            $add: [
              { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", true] } } } },
              newRepo.private ? 1 : 0
            ]
          }
        }
      }
    ],
    {
      new: true,
      runValidators: true
    }
  );

  if (!addResult) {
    throw new Error('Failed to add repository: Organization not found');
  }

  return addResult;
};

OrganizationSchema.methods.removeRepository = async function(repoId: string) {
  const Model = this.constructor as mongoose.Model<IOrganization>;

  const result = await Model.findOneAndUpdate(
    { _id: this._id },
    [
      {
        $set: {
          repos: { $filter: { input: "$repos", cond: { $ne: ["$$this.repo_id", repoId] } } },
          updated_at: new Date()
        }
      },
      {
        $set: {
          total_repos: { $size: "$repos" },
          public_repos: { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", false] } } } },
          private_repos: { $size: { $filter: { input: "$repos", cond: { $eq: ["$$this.private", true] } } } }
        }
      }
    ],
    {
      new: true,
      runValidators: true
    }
  );

  if (!result) {
    throw new Error('Failed to remove repository: Organization not found');
  }

  return result;
};

OrganizationSchema.methods.updateRepositorySync = async function(repoId: string) {
  const Model = this.constructor as mongoose.Model<IOrganization>;

  const result = await Model.findOneAndUpdate(
    {
      _id: this._id,
      'repos.repo_id': repoId
    },
    {
      $set: {
        'repos.$.last_sync': new Date(),
        updated_at: new Date()
      }
    },
    {
      new: true,
      runValidators: true
    }
  );

  // If repository was not found, return the current document unchanged
  if (!result) {
    return this;
  }

  return result;
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
