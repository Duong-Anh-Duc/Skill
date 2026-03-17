export interface TokenInfo {
  user_id: string;
  token_preview: string;
  expiry: string;
  created_at: string;
  updated_at: string;
}

export interface TokenData {
  access_token: string;
  expiry: string;
  refreshed: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface GmailInfo {
  total_labels: number;
  inbox_total: number;
  inbox_unread: number;
}

export interface DriveFile {
  name: string;
  type: string;
}

export interface CalendarEvent {
  summary: string;
  start: string;
}
