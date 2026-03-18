import apiClient from './client';
import type { ApiResponse, TokenData, TokenInfo } from '@/types';

export const oauthApi = {
  getConnectUrl(userId: string): string {
    const base = import.meta.env.VITE_API_URL || '/api';
    const redirectUrl = window.location.origin;
    return `${base}/oauth/connect?userId=${encodeURIComponent(userId)}&redirectUrl=${encodeURIComponent(redirectUrl)}`;
  },

  getToken(userId: string) {
    return apiClient.get<ApiResponse<TokenData>>(`/token/${encodeURIComponent(userId)}`);
  },

  getTokenInfo(userId: string) {
    return apiClient.get<ApiResponse<TokenInfo>>(`/token/${encodeURIComponent(userId)}/info`);
  },

  revokeToken(userId: string) {
    return apiClient.delete<ApiResponse>(`/token/${encodeURIComponent(userId)}`);
  },
};
