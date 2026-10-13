import { Router } from 'express';
import { RequestController } from '../controllers/requestController.js';

const router = Router();

router.post('/', RequestController.create);
router.get('/nearby', RequestController.getNearby);
router.patch('/:id/assign', RequestController.assign);
router.post('/:id/complete', RequestController.complete);
router.get('/:id/messages', RequestController.getMessages);

export default router;