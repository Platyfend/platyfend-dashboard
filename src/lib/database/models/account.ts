import mongoose, { Schema } from 'mongoose';
import { IAccount, AccountType } from './types';

const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      enum: Object.values(AccountType),
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    providerAccountId: {
      type: String,
      required: true,
    },
    refresh_token: {
      type: String,
      required: false,
    },
    access_token: {
      type: String,
      required: false,
    },
    expires_at: {
      type: Number,
      required: false,
    },
    token_type: {
      type: String,
      required: false,
    },
    scope: {
      type: String,
      required: false,
    },
    id_token: {
      type: String,
      required: false,
    },
    session_state: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index
AccountSchema.index({ provider: 1, providerAccountId: 1 }, { unique: true });

export const Account = mongoose.models.Account || mongoose.model<IAccount>('Account', AccountSchema);
