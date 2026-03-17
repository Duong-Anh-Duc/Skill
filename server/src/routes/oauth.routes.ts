import { Router } from 'express';
import { oauthController } from '../controllers';

const router = Router();

router.get('/connect', oauthController.connect);
router.get('/callback', oauthController.callback);

export default router;
