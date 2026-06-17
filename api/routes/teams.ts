import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, teamController.create);
router.get('/', authMiddleware, teamController.list);
router.get('/recommended', authMiddleware, teamController.recommended);
router.get('/:id', teamController.detail);
router.post('/:id/join', authMiddleware, teamController.join);
router.post('/:id/leave', authMiddleware, teamController.leave);
router.post('/join-by-code', authMiddleware, teamController.joinByCode);

export default router;
