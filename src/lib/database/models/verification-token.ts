import mongoose, { Schema } from 'mongoose';
import { IVerificationToken } from './types';

const VerificationTokenSchema = new Schema<IVerificationToken>(
  {
    identifier: {
      type: String,
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound unique index
VerificationTokenSchema.index({ identifier: 1, token: 1 }, { unique: true });

export const VerificationToken = mongoose.models.VerificationToken || mongoose.model<IVerificationToken>('VerificationToken', VerificationTokenSchema);
