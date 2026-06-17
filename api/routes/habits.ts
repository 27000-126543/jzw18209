import { Router } from 'express';
import { habitController } from '../controllers/habitController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, habitController.create);
router.get('/', authMiddleware, habitController.list);
router.get('/progress', authMiddleware, habitController.progress);
router.get('/:id', authMiddleware, habitController.detail);
router.put('/:id', authMiddleware, habitController.update);
router.delete('/:id', authMiddleware, habitController.remove);

export default router;
