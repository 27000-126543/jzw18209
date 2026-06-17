import { Router } from 'express';
import { notificationController } from '../controllers/notificationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, notificationController.list);
router.get('/unread-count', authMiddleware, notificationController.unreadCount);
router.post('/:id/read', authMiddleware, notificationController.markRead);
router.post('/read-all', authMiddleware, notificationController.markAllRead);
router.delete('/:id', authMiddleware, notificationController.remove);

export default router;
