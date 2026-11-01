export type ClipboardExpiry = '10m' | '1h' | '6h' | '12h' | '24h' | '7d';

export type AttachmentType = 'image' | 'pdf' | 'word' | 'excel' | 'powerpoint' | 'file' | 'document';

export interface ClipboardAttachment {
  id: string;
  name: string;
  size: number;
  type: AttachmentType;
  mimeType: string;
  path: string;
  url?: string | null;
}

export interface ClipboardItem {
  id: string;
  slug: string;
  textContent: string | null;
  imagePath: string | null; // legacy single image path
  imageUrl?: string | null; // legacy single image url
  attachments?: ClipboardAttachment[]; // new multi-file attachments (images & docs)
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
  attachmentsCount?: number;
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
