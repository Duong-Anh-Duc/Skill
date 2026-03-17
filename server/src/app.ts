import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config';
import { errorHandler, notFoundHandler, requestLogger } from './middlewares';
import routes from './routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    `http://localhost:${config.port}`,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://192.168.1.30:5173',
    'https://google.openclaw-box.com',
    config.appUrl,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// API routes
app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
