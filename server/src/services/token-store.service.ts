import prisma from '../config/database';
import { oauthService } from './oauth.service';

export const tokenStoreService = {
  async saveTokens(userId: string, tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }) {
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Missing access_token or refresh_token');
    }

    const expiry = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600 * 1000);

    return prisma.googleToken.upsert({
      where: { user_id: userId },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry,
      },
      create: {
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry,
      },
    });
  },

  async getValidToken(userId: string) {
    const record = await prisma.googleToken.findUnique({ where: { user_id: userId } });
    if (!record) return null;

    const now = new Date();
    const bufferMs = 60 * 1000; // refresh 1 phút trước khi hết hạn

    if (record.expiry.getTime() - bufferMs > now.getTime()) {
      return {
        access_token: record.access_token,
        expiry: record.expiry,
        refreshed: false,
      };
    }

    // Token hết hạn → auto refresh
    const credentials = await oauthService.refreshAccessToken(record.refresh_token);
    const newExpiry = credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600 * 1000);

    await prisma.googleToken.update({
      where: { user_id: userId },
      data: {
        access_token: credentials.access_token!,
        expiry: newExpiry,
      },
    });

    return {
      access_token: credentials.access_token!,
      expiry: newExpiry,
      refreshed: true,
    };
  },

  async getTokenInfo(userId: string) {
    return prisma.googleToken.findUnique({ where: { user_id: userId } });
  },

  async revokeAndDelete(userId: string) {
    const record = await prisma.googleToken.findUnique({ where: { user_id: userId } });
    if (!record) return null;

    try {
      await oauthService.revokeToken(record.access_token);
    } catch (err) {
      console.warn('Failed to revoke token at Google (may already be revoked):', (err as Error).message);
    }

    await prisma.googleToken.delete({ where: { user_id: userId } });
    return { revoked: true };
  },
};
