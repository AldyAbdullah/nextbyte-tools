export type ClipboardExpiry = '1h' | '6h' | '24h' | '7d';

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
}

export interface CreateClipboardPayload {
  slug: string;
  textContent?: string;
  expiry: ClipboardExpiry;
  password?: string;
}

export interface CreateClipboardResponse {
  success: boolean;
  slug?: string;
  url?: string;
  managementToken?: string;
  expiresAt?: string;
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
