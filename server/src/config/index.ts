import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3002', 10),
  database: { url: process.env.DATABASE_URL || '' },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3002/api/oauth/callback',
    scopes: [
      // Gmail - full access
      'https://mail.google.com/',
      // Drive - full access (bao gồm Sheets, Docs, Slides files)
      'https://www.googleapis.com/auth/drive',
      // Calendar - full access
      'https://www.googleapis.com/auth/calendar',
      // Sheets - full access
      'https://www.googleapis.com/auth/spreadsheets',
      // Docs - full access
      'https://www.googleapis.com/auth/documents',
      // Slides - full access
      'https://www.googleapis.com/auth/presentations',
      // Contacts & People API
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/directory.readonly',
      // Tasks - full access
      'https://www.googleapis.com/auth/tasks',
      // YouTube - full access
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      // Google Photos
      'https://www.googleapis.com/auth/photoslibrary',
      // User profile
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'openid',
    ] as string[],
  },
  appUrl: process.env.APP_URL || 'http://localhost:5173',
} as const;
