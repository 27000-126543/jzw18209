import { Router } from 'express';
import { checkInController } from '../controllers/checkInController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, checkInController.create);
router.get('/feed', authMiddleware, checkInController.feed);
router.get('/explore', checkInController.explore);
router.post('/:id/like', authMiddleware, checkInController.like);
router.post('/:id/comments', authMiddleware, checkInController.comment);
router.get('/:id/comments', checkInController.getComments);
router.delete('/:id', authMiddleware, checkInController.remove);

export default router;
