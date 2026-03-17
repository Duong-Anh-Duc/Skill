import { OAuth2Client } from 'google-auth-library';
import { config } from '../config';

const oauthClient = new OAuth2Client(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri,
);

export const oauthService = {
  getAuthUrl(userId: string): string {
    return oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: [...config.google.scopes],
      prompt: 'consent',
      state: userId,
    });
  },

  async exchangeCode(code: string) {
    const { tokens } = await oauthClient.getToken(code);
    return tokens;
  },

  async refreshAccessToken(refreshToken: string) {
    oauthClient.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await oauthClient.refreshAccessToken();
    return credentials;
  },

  async revokeToken(accessToken: string) {
    await oauthClient.revokeToken(accessToken);
  },

  getClient() {
    return oauthClient;
  },
};
