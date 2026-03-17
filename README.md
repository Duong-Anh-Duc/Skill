# Google OAuth2 Service

Google OAuth2 service tách riêng client/server, code style theo Openclaw-box.

## Cấu trúc

```
test-skill/
├── server/                        # Backend - Express + Prisma
│   ├── src/
│   │   ├── index.ts               # Entry point
│   │   ├── app.ts                 # Express app
│   │   ├── config/                # Config & Prisma client
│   │   ├── controllers/           # oauth.controller.ts
│   │   ├── services/              # oauth.service.ts, token-store.service.ts
│   │   ├── routes/                # oauth.routes.ts, token.routes.ts
│   │   └── middlewares/
│   ├── prisma/schema.prisma       # GoogleToken model
│   ├── .env / .env.example
│   └── package.json
│
├── client/                        # Frontend - React + Vite + Ant Design
│   ├── src/
│   │   ├── main.tsx               # Entry point
│   │   ├── App.tsx                # Router + providers
│   │   ├── api/                   # Axios client + oauth API
│   │   ├── pages/OAuthPage.tsx    # Main test UI page
│   │   ├── stores/                # Zustand store
│   │   ├── types/                 # TypeScript interfaces
│   │   └── utils/                 # Toast helpers
│   ├── vite.config.ts             # Proxy /api → server:3002
│   └── package.json
│
└── README.md
```

## Setup

### 1. Tạo database PostgreSQL

```bash
createdb google_oauth_service
```

### 2. Config server .env

```bash
cd server
cp .env.example .env
# Sửa GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
```

### 3. Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Tạo OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:3002/api/oauth/callback`
4. Copy Client ID & Secret vào `server/.env`
5. Bật API: Gmail, Drive, Calendar

### 4. Chạy

Terminal 1 - Server:
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

Terminal 2 - Client:
```bash
cd client
npm install
npm run dev
```

### 5. Mở UI

Truy cập `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/oauth/connect?userId=xxx` | Redirect đến Google OAuth consent |
| GET | `/api/oauth/callback` | Google callback, lưu token |
| GET | `/api/token/:userId` | Lấy access token (auto refresh) |
| GET | `/api/token/:userId/info` | Xem thông tin token |
| DELETE | `/api/token/:userId` | Revoke & xoá token |
| GET | `/api/health` | Health check |
# Skill
