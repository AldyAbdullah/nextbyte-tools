export type ClipboardExpiry = '10m' | '1h' | '6h' | '12h' | '24h' | '7d';

export interface ClipboardItem {
  id: string;
  slug: string;
  textContent: string | null;
  imagePath: string | null;
  imageUrl?: string | null; // Pre-signed private URL generated securely on server
  createdAt: string;
  expiresAt: string;
  isPasswordProtected: boolean;
  hasManagementToken?: boolean;
  burnAfterRead?: boolean; // If true, burns immediately after first read by a recipient
  isBurned?: boolean; // Set true when delivered to recipient and purged from server
}

export interface CreateClipboardPayload {
  slug: string;
  textContent?: string;
  expiry: ClipboardExpiry;
  password?: string;
  burnAfterRead?: boolean;
}

export interface CreateClipboardResponse {
  success: boolean;
  slug?: string;
  url?: string;
  managementToken?: string;
  expiresAt?: string;
  burnAfterRead?: boolean;
  error?: string;
}

export interface VerifyPasswordResponse {
  success: boolean;
  item?: ClipboardItem;
  error?: string;
}

export interface DeleteClipboardResponse {
  success: boolean;
  error?: string;
}
