import { Router } from 'express';
import { oauthController } from '../controllers';

const router = Router();

router.get('/:userId', oauthController.getToken);
router.get('/:userId/info', oauthController.getTokenInfo);
router.delete('/:userId', oauthController.revokeToken);

export default router;
