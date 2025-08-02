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