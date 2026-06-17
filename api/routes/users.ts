import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/search', userController.search);
router.get('/suggested', authMiddleware, userController.suggested);
router.get('/:id', userController.profile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.get('/:id/followers', userController.followers);
router.get('/:id/following', userController.following);
router.get('/:id/badges', userController.badges);
router.post('/:userId/follow', authMiddleware, userController.follow);
router.delete('/:userId/unfollow', authMiddleware, userController.unfollow);

export default router;
