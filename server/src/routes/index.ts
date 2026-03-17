import { Router } from 'express';
import oauthRoutes from './oauth.routes';
import tokenRoutes from './token.routes';

const router = Router();

router.use('/oauth', oauthRoutes);
router.use('/token', tokenRoutes);

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
