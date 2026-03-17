import { Request, Response } from 'express';
import { config } from '../config';
import { oauthService, tokenStoreService } from '../services';

export const oauthController = {
  // GET /api/oauth/connect?userId=xxx
  connect(req: Request, res: Response) {
    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const authUrl = oauthService.getAuthUrl(userId);
    res.redirect(authUrl);
  },

  // GET /api/oauth/callback?code=xxx&state=userId
  async callback(req: Request, res: Response) {
    try {
      const { code, state: userId, error } = req.query;

      if (error) {
        return res.redirect(`${config.appUrl}?error=${encodeURIComponent(error as string)}`);
      }

      if (!code || !userId || typeof code !== 'string' || typeof userId !== 'string') {
        return res.redirect(`${config.appUrl}?error=missing_code_or_state`);
      }

      const tokens = await oauthService.exchangeCode(code);
      await tokenStoreService.saveTokens(userId, tokens);

      res.redirect(`${config.appUrl}?status=connected&userId=${encodeURIComponent(userId)}`);
    } catch (err) {
      console.error('OAuth callback error:', err);
      res.redirect(`${config.appUrl}?error=${encodeURIComponent((err as Error).message)}`);
    }
  },

  // GET /api/token/:userId
  async getToken(req: Request<{ userId: string }>, res: Response) {
    try {
      const { userId } = req.params;
      const result = await tokenStoreService.getValidToken(userId);

      if (!result) {
        return res.status(404).json({ success: false, message: 'No token found for this user' });
      }

      res.json({
        success: true,
        data: {
          access_token: result.access_token,
          expiry: result.expiry,
          refreshed: result.refreshed,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },

  // DELETE /api/token/:userId
  async revokeToken(req: Request<{ userId: string }>, res: Response) {
    try {
      const { userId } = req.params;
      const result = await tokenStoreService.revokeAndDelete(userId);

      if (!result) {
        return res.status(404).json({ success: false, message: 'No token found for this user' });
      }

      res.json({ success: true, message: 'Token revoked and deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },

  // GET /api/token/:userId/info
  async getTokenInfo(req: Request<{ userId: string }>, res: Response) {
    try {
      const { userId } = req.params;
      const record = await tokenStoreService.getTokenInfo(userId);

      if (!record) {
        return res.status(404).json({ success: false, message: 'No token found for this user' });
      }

      res.json({
        success: true,
        data: {
          user_id: record.user_id,
          token_preview: record.access_token.substring(0, 20) + '...',
          expiry: record.expiry,
          created_at: record.created_at,
          updated_at: record.updated_at,
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, message: (err as Error).message });
    }
  },
};
